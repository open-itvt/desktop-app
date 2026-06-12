use std::io::Read;
use std::panic;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use gstreamer::prelude::*;
use gstreamer::{ClockTime, MessageView, State};
use gstreamer_app::AppSinkCallbacks;
use tiny_http::{Header, Response, Server, StatusCode};

const BOUNDARY: &str = "GStreamerMJPEGBoundary";

pub fn snapshot_one(url: &str) -> Result<Vec<u8>, String> {
    let _ = gstreamer::init();

    let frame: Arc<Mutex<Vec<u8>>> = Arc::new(Mutex::new(Vec::new()));
    let got_frame = Arc::new(AtomicBool::new(false));

    let pipeline = gstreamer::Pipeline::new();

    let src = gstreamer::ElementFactory::make("uridecodebin")
        .name("src")
        .property("uri", url)
        .build()
        .map_err(|e| format!("uridecodebin: {e}"))?;

    let videoconvert = gstreamer::ElementFactory::make("videoconvert")
        .name("videoconvert")
        .build()
        .map_err(|e| format!("videoconvert: {e}"))?;

    let jpegenc = gstreamer::ElementFactory::make("jpegenc")
        .name("jpegenc")
        .property("quality", 80i32)
        .build()
        .map_err(|e| format!("jpegenc: {e}"))?;

    let appsink = gstreamer_app::AppSink::builder()
        .name("appsink")
        .max_buffers(2)
        .drop(true)
        .build();

    pipeline
        .add_many(&[&src, &videoconvert, &jpegenc, appsink.upcast_ref()])
        .map_err(|e| format!("add elements: {e}"))?;

    let vc = videoconvert.clone();
    src.connect_pad_added(move |_db, src_pad| {
        let caps = match src_pad.current_caps() {
            Some(c) => c,
            None => return,
        };
        let structure = match caps.structure(0) {
            Some(s) => s,
            None => return,
        };
        if !structure.name().starts_with("video/") {
            return;
        }
        let sink_pad = vc.static_pad("sink").unwrap();
        if sink_pad.is_linked() {
            return;
        }
        let _ = src_pad.link(&sink_pad);
    });

    videoconvert.link(&jpegenc).map_err(|e| format!("vc -> jpg: {e}"))?;
    jpegenc.link(&appsink).map_err(|e| format!("jpg -> sink: {e}"))?;

    let f = frame.clone();
    let g = got_frame.clone();
    let callbacks = AppSinkCallbacks::builder()
        .new_sample(move |sink| {
            if g.load(Ordering::SeqCst) {
                return Err(gstreamer::FlowError::Eos);
            }
            let sample = match sink.pull_sample() {
                Ok(s) => s,
                Err(_) => return Err(gstreamer::FlowError::Eos),
            };
            let buffer = match sample.buffer() {
                Some(b) => b,
                None => return Err(gstreamer::FlowError::Error),
            };
            let map = match buffer.map_readable() {
                Ok(m) => m,
                Err(_) => return Err(gstreamer::FlowError::Error),
            };
            if let Ok(mut locked) = f.try_lock() {
                *locked = map.as_slice().to_vec();
                g.store(true, Ordering::SeqCst);
            }
            Err(gstreamer::FlowError::Eos)
        })
        .build();

    appsink.set_callbacks(callbacks);

    let bus = pipeline.bus().unwrap();
    let _ = pipeline.set_state(State::Playing);

    // Wait up to 8 seconds for a frame
    let timeout = Duration::from_secs(8);
    let start = std::time::Instant::now();
    let mut got_data = false;

    while start.elapsed() < timeout {
        if got_frame.load(Ordering::SeqCst) {
            got_data = true;
            break;
        }
        if let Some(msg) = bus.timed_pop(ClockTime::from_mseconds(100)) {
            match msg.view() {
                MessageView::Error(err) => {
                    eprintln!("[snapshot] Error: {:?} - {:?}", err.error(), err.debug());
                    break;
                }
                MessageView::Eos(..) => break,
                _ => {}
            }
        }
    }

    let _ = pipeline.set_state(State::Null);

    if got_data {
        let locked = frame.lock().map_err(|_| "mutex poisoned".to_string())?;
        Ok(locked.clone())
    } else {
        Err("no frame captured".into())
    }
}

pub struct HlsPlayer {
    running: Arc<AtomicBool>,
    latest_frame: Arc<Mutex<Vec<u8>>>,
    pipeline: Option<gstreamer::Pipeline>,
    pipeline_thread: Option<thread::JoinHandle<()>>,
} // http thread is detached — it cleans itself up when running goes false

impl HlsPlayer {
    pub fn new() -> Self {
        HlsPlayer {
            running: Arc::new(AtomicBool::new(false)),
            latest_frame: Arc::new(Mutex::new(Vec::new())),
            pipeline: None,
            pipeline_thread: None,
        }
    }

    pub fn start(&mut self, url: &str) -> Result<u16, String> {
        let _ = gstreamer::init();
        if self.running.load(Ordering::SeqCst) {
            return Err("already running".into());
        }

        let running = Arc::new(AtomicBool::new(true));
        self.running = running.clone();
        let frame: Arc<Mutex<Vec<u8>>> = self.latest_frame.clone();

        let pipeline = gstreamer::Pipeline::new();

        let src = gstreamer::ElementFactory::make("uridecodebin")
            .name("src")
            .property("uri", url)
            .build()
            .map_err(|e| format!("uridecodebin: {e}"))?;

        let videoconvert = gstreamer::ElementFactory::make("videoconvert")
            .name("videoconvert")
            .build()
            .map_err(|e| format!("videoconvert: {e}"))?;

        let jpegenc = gstreamer::ElementFactory::make("jpegenc")
            .name("jpegenc")
            .property("quality", 80i32)
            .build()
            .map_err(|e| format!("jpegenc: {e}"))?;

        let appsink = gstreamer_app::AppSink::builder()
            .name("appsink")
            .max_buffers(2)
            .drop(true)
            .build();

        pipeline
            .add_many(&[&src, &videoconvert, &jpegenc, appsink.upcast_ref()])
            .map_err(|e| format!("add elements: {e}"))?;

        let vc = videoconvert.clone();
        src.connect_pad_added(move |_db, src_pad| {
            let caps = match src_pad.current_caps() {
                Some(c) => c,
                None => return,
            };
            let structure = match caps.structure(0) {
                Some(s) => s,
                None => return,
            };
            if !structure.name().starts_with("video/") {
                return;
            }
            let sink_pad = vc.static_pad("sink").unwrap();
            if sink_pad.is_linked() {
                return;
            }
            let _ = src_pad.link(&sink_pad);
        });

        videoconvert.link(&jpegenc).map_err(|e| format!("vc -> jpg: {e}"))?;
        jpegenc.link(&appsink).map_err(|e| format!("jpg -> sink: {e}"))?;

        let f = frame.clone();
        let r = running.clone();
        let callbacks = AppSinkCallbacks::builder()
            .new_sample(move |sink| {
                if !r.load(Ordering::SeqCst) {
                    return Err(gstreamer::FlowError::Eos);
                }
                let sample = match sink.pull_sample() {
                    Ok(s) => s,
                    Err(_) => return Err(gstreamer::FlowError::Eos),
                };
                let buffer = match sample.buffer() {
                    Some(b) => b,
                    None => return Err(gstreamer::FlowError::Error),
                };
                let map = match buffer.map_readable() {
                    Ok(m) => m,
                    Err(_) => return Err(gstreamer::FlowError::Error),
                };
                if let Ok(mut locked) = f.try_lock() {
                    *locked = map.as_slice().to_vec();
                }
                Ok(gstreamer::FlowSuccess::Ok)
            })
            .build();

        appsink.set_callbacks(callbacks);

        let bus = pipeline.bus().unwrap();
        let r2 = running.clone();
        let pipeline_clone = pipeline.clone();
        let pipe_thread = thread::spawn(move || {
            let _ = pipeline_clone.set_state(State::Playing);
            while r2.load(Ordering::SeqCst) {
                if let Some(msg) = bus.timed_pop(ClockTime::from_mseconds(100)) {
                    match msg.view() {
                        MessageView::Eos(..) => break,
                        MessageView::Error(err) => {
                            eprintln!("[HlsPlayer] Error: {:?} - {:?}", err.error(), err.debug());
                            break;
                        }
                        _ => {}
                    }
                }
            }
            let _ = pipeline_clone.set_state(State::Null);
        });

        self.pipeline = Some(pipeline);
        self.pipeline_thread = Some(pipe_thread);

        let port = find_free_port(8090).ok_or("no free port")?;
        let http_running = running.clone();
        let http_frame = frame.clone();

        let _ = thread::spawn(move || {
            let addr = format!("127.0.0.1:{port}");
            let server = match Server::http(&addr) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("[HlsPlayer] HTTP server failed: {e}");
                    return;
                }
            };
            for req in server.incoming_requests() {
                if !http_running.load(Ordering::SeqCst) {
                    break;
                }
                let result = panic::catch_unwind(panic::AssertUnwindSafe(|| {
                    let res = match req.url() {
                        "/stream" => stream_mjpeg(&http_frame, &http_running).boxed(),
                        "/health" => make_plaintext(200, "OK").boxed(),
                        _ => make_plaintext(200, "iTVT Stream Server").boxed(),
                    };
                    let _ = req.respond(res);
                }));
                if let Err(e) = result {
                    eprintln!("[HlsPlayer] Request handler panicked: {:?}", e);
                }
            }
        });
        // HTTP thread is detached — no JoinHandle stored
        Ok(port)
    }

    pub fn stop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
        if let Some(pipe) = self.pipeline.take() {
            let _ = pipe.set_state(State::Null);
        }
        if let Some(h) = self.pipeline_thread.take() {
            let _ = h.join();
        }
        // http thread is detached — exits on its own when running goes false
    }
}

impl Drop for HlsPlayer {
    fn drop(&mut self) {
        self.stop();
    }
}

// ── Streaming MJPEG reader ──────────────────────────────────────

struct MjpegStreamer {
    frame: Arc<Mutex<Vec<u8>>>,
    running: Arc<AtomicBool>,
    boundary: Vec<u8>,
    part_buf: Vec<u8>,
    part_pos: usize,
    first_frame: bool,
}

impl MjpegStreamer {
    fn new(frame: Arc<Mutex<Vec<u8>>>, running: Arc<AtomicBool>) -> Self {
        MjpegStreamer {
            frame,
            running,
            boundary: BOUNDARY.as_bytes().to_vec(),
            part_buf: Vec::new(),
            part_pos: 0,
            first_frame: true,
        }
    }

    fn next_chunk(&mut self) -> bool {
        for _ in 0..150 {
            if !self.running.load(Ordering::SeqCst) {
                return false;
            }

            let maybe_data: Option<Vec<u8>> = self.frame.try_lock().ok().and_then(|g| {
                if g.is_empty() { None } else { Some(g.clone()) }
            });

            match maybe_data {
                Some(data) => {
                    self.part_buf.clear();
                    if !self.first_frame {
                        self.part_buf.extend_from_slice(b"\r\n");
                    }
                    self.first_frame = false;
                    self.part_buf.extend_from_slice(b"--");
                    self.part_buf.extend_from_slice(&self.boundary);
                    self.part_buf.extend_from_slice(b"\r\nContent-Type: image/jpeg\r\nContent-Length: ");
                    self.part_buf.extend_from_slice(data.len().to_string().as_bytes());
                    self.part_buf.extend_from_slice(b"\r\n\r\n");
                    self.part_buf.extend_from_slice(&data);
                    self.part_pos = 0;
                    return true;
                }
                None => {
                    thread::sleep(Duration::from_millis(100));
                }
            }
        }
        false
    }
}

impl Read for MjpegStreamer {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        if !self.running.load(Ordering::SeqCst) {
            return Ok(0);
        }

        while self.part_pos >= self.part_buf.len() {
            if !self.next_chunk() {
                return Ok(0);
            }
        }

        let to_copy = std::cmp::min(buf.len(), self.part_buf.len() - self.part_pos);
        buf[..to_copy].copy_from_slice(&self.part_buf[self.part_pos..self.part_pos + to_copy]);
        self.part_pos += to_copy;
        Ok(to_copy)
    }
}

fn stream_mjpeg(
    frame: &Arc<Mutex<Vec<u8>>>,
    running: &Arc<AtomicBool>,
) -> Response<MjpegStreamer> {
    let streamer = MjpegStreamer::new(frame.clone(), running.clone());
    let ct = format!("multipart/x-mixed-replace; boundary={BOUNDARY}");

    let mut headers = Vec::new();
    headers.push(Header::from_bytes(&b"Content-Type"[..], ct.as_bytes()).unwrap());
    headers.push(
        Header::from_bytes(&b"Cache-Control"[..], &b"no-cache, no-store, must-revalidate"[..])
            .unwrap(),
    );
    headers.push(Header::from_bytes(&b"Pragma"[..], &b"no-cache"[..]).unwrap());
    headers.push(Header::from_bytes(&b"Expires"[..], &b"0"[..]).unwrap());

    Response::new(StatusCode(200), headers, streamer, None, None)
}

fn make_plaintext(status: u16, body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let ct = format!("text/plain; charset=utf-8");
    let mut headers = Vec::new();
    headers.push(Header::from_bytes(&b"Content-Type"[..], ct.as_bytes()).unwrap());
    Response::new(StatusCode(status), headers, std::io::Cursor::new(body.as_bytes().to_vec()), None, None)
}

fn find_free_port(start: u16) -> Option<u16> {
    (start..start + 100).find(|port| {
        std::net::TcpListener::bind(format!("127.0.0.1:{port}")).is_ok()
    })
}
