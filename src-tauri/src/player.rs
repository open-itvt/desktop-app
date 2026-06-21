use std::panic;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tiny_http::{Header, Response, ResponseBox, Server, StatusCode};

// ── Linux: GStreamer HLS player ──────────────────────────────
#[cfg(target_os = "linux")]
mod gst_impl {
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::{Arc, Mutex};
    use std::thread;
    use std::time::Duration;

    use gstreamer::prelude::*;
    use gstreamer::{ClockTime, MessageView, State};
    use gstreamer_app::AppSinkCallbacks;

    pub fn snapshot_one(url: &str) -> Result<Vec<u8>, String> {
        let _ = gstreamer::init();
        let frame: Arc<Mutex<Vec<u8>>> = Arc::new(Mutex::new(Vec::new()));
        let got_frame = Arc::new(AtomicBool::new(false));
        let pipeline = gstreamer::Pipeline::new();

        let src = gstreamer::ElementFactory::make("uridecodebin")
            .name("src").property("uri", url).build().map_err(|e| format!("uridecodebin: {e}"))?;
        let vc = gstreamer::ElementFactory::make("videoconvert")
            .name("videoconvert").build().map_err(|e| format!("videoconvert: {e}"))?;
        let jpegenc = gstreamer::ElementFactory::make("jpegenc")
            .name("jpegenc").property("quality", 80i32).build()
            .map_err(|e| format!("jpegenc: {e}"))?;
        let appsink = gstreamer_app::AppSink::builder()
            .name("appsink").max_buffers(2).drop(true).build();

        pipeline.add_many(&[&src, &vc, &jpegenc, appsink.upcast_ref()]).map_err(|e| format!("add: {e}"))?;

        let vcc = vc.clone();
        src.connect_pad_added(move |_db, pad| {
            if let Some(caps) = pad.current_caps() {
                if let Some(s) = caps.structure(0) {
                    if s.name().starts_with("video/") {
                        let sink = vcc.static_pad("sink").unwrap();
                        if !sink.is_linked() { let _ = pad.link(&sink); }
                    }
                }
            }
        });
        vc.link(&jpegenc).map_err(|e| format!("vc->jpg: {e}"))?;
        jpegenc.link(&appsink).map_err(|e| format!("jpg->sink: {e}"))?;

        let f = frame.clone();
        let g = got_frame.clone();
        appsink.set_callbacks(AppSinkCallbacks::builder()
            .new_sample(move |sink| {
                if g.load(Ordering::SeqCst) { return Err(gstreamer::FlowError::Eos); }
                let sample = sink.pull_sample().map_err(|_| gstreamer::FlowError::Eos)?;
                let map = sample.buffer().ok_or(gstreamer::FlowError::Error)?
                    .map_readable().map_err(|_| gstreamer::FlowError::Error)?;
                if let Ok(mut locked) = f.try_lock() { *locked = map.as_slice().to_vec(); }
                g.store(true, Ordering::SeqCst);
                Err(gstreamer::FlowError::Eos)
            }).build());

        let bus = pipeline.bus().unwrap();
        let _ = pipeline.set_state(State::Playing);
        let start = std::time::Instant::now();
        while start.elapsed() < Duration::from_secs(8) {
            if got_frame.load(Ordering::SeqCst) {
                let locked = frame.lock().map_err(|_| "mutex poisoned".to_string())?;
                let _ = pipeline.set_state(State::Null);
                return Ok(locked.clone());
            }
            if let Some(msg) = bus.timed_pop(ClockTime::from_mseconds(100)) {
                if matches!(msg.view(), MessageView::Eos(..)) { break; }
            }
        }
        let _ = pipeline.set_state(State::Null);
        Err("no frame captured".into())
    }

    pub struct HlsPlayer {
        pub running: Arc<AtomicBool>,
        pub latest_frame: Arc<Mutex<Vec<u8>>>,
        pipeline: Option<gstreamer::Pipeline>,
        pipeline_thread: Option<thread::JoinHandle<()>>,
    }

    impl HlsPlayer {
        pub fn new() -> Self {
            HlsPlayer {
                running: Arc::new(AtomicBool::new(false)),
                latest_frame: Arc::new(Mutex::new(Vec::new())),
                pipeline: None, pipeline_thread: None,
            }
        }
        pub fn start(&mut self, url: &str) -> Result<(), String> {
            let _ = gstreamer::init();
            if self.running.swap(true, Ordering::SeqCst) { return Err("already running".into()); }
            let running = self.running.clone();
            let frame = self.latest_frame.clone();
            let pipeline = gstreamer::Pipeline::new();

            let src = gstreamer::ElementFactory::make("uridecodebin")
                .name("src").property("uri", url).build().map_err(|e| format!("uridecodebin: {e}"))?;
            let vc = gstreamer::ElementFactory::make("videoconvert")
                .name("videoconvert").build().map_err(|e| format!("videoconvert: {e}"))?;
            let jpegenc = gstreamer::ElementFactory::make("jpegenc")
                .name("jpegenc").property("quality", 80i32).build()
                .map_err(|e| format!("jpegenc: {e}"))?;
            let appsink = gstreamer_app::AppSink::builder()
                .name("appsink").max_buffers(2).drop(true).build();

            pipeline.add_many(&[&src, &vc, &jpegenc, appsink.upcast_ref()]).map_err(|e| format!("add: {e}"))?;
            let vcc = vc.clone();
            src.connect_pad_added(move |_db, pad| {
                if let Some(caps) = pad.current_caps() {
                    if let Some(s) = caps.structure(0) {
                        if s.name().starts_with("video/") {
                            let sink = vcc.static_pad("sink").unwrap();
                            if !sink.is_linked() { let _ = pad.link(&sink); }
                        }
                    }
                }
            });
            vc.link(&jpegenc).map_err(|e| format!("vc->jpg: {e}"))?;
            jpegenc.link(&appsink).map_err(|e| format!("jpg->sink: {e}"))?;

            let f = frame.clone();
            let r = running.clone();
            appsink.set_callbacks(AppSinkCallbacks::builder()
                .new_sample(move |sink| {
                    if !r.load(Ordering::SeqCst) { return Err(gstreamer::FlowError::Eos); }
                    let sample = sink.pull_sample().map_err(|_| gstreamer::FlowError::Eos)?;
                    let map = sample.buffer().ok_or(gstreamer::FlowError::Error)?
                        .map_readable().map_err(|_| gstreamer::FlowError::Error)?;
                    if let Ok(mut locked) = f.try_lock() { *locked = map.as_slice().to_vec(); }
                    Ok(gstreamer::FlowSuccess::Ok)
                }).build());

            let bus = pipeline.bus().unwrap();
            let r2 = running.clone();
            let p = pipeline.clone();
            self.pipeline_thread = Some(thread::spawn(move || {
                let _ = p.set_state(State::Playing);
                while r2.load(Ordering::SeqCst) {
                    if let Some(msg) = bus.timed_pop(ClockTime::from_mseconds(100)) {
                        match msg.view() {
                            MessageView::Eos(..) | MessageView::Error(..) => break,
                            _ => {}
                        }
                    }
                }
                let _ = p.set_state(State::Null);
            }));
            self.pipeline = Some(pipeline);
            Ok(())
        }
        pub fn stop(&mut self) {
            self.running.store(false, Ordering::SeqCst);
            if let Some(pipe) = self.pipeline.take() { let _ = pipe.set_state(State::Null); }
            if let Some(h) = self.pipeline_thread.take() { let _ = h.join(); }
        }
        pub fn is_running(&self) -> bool { self.running.load(Ordering::SeqCst) }
    }
    impl Drop for HlsPlayer {
        fn drop(&mut self) { self.stop(); }
    }
}

#[cfg(target_os = "linux")]
use gst_impl::*;

// ── Non‑Linux stubs ──────────────────────────────────────────
#[cfg(not(target_os = "linux"))]
mod stub {
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::{Arc, Mutex};

    pub fn snapshot_one(_url: &str) -> Result<Vec<u8>, String> {
        Err("snapshot not supported on this platform".into())
    }

    pub struct HlsPlayer {
        pub running: Arc<AtomicBool>,
        _frame: Arc<Mutex<Vec<u8>>>,
    }

    #[allow(dead_code)]
    impl HlsPlayer {
        pub fn new() -> Self {
            HlsPlayer { running: Arc::new(AtomicBool::new(false)), _frame: Arc::new(Mutex::new(Vec::new())) }
        }
        pub fn start(&mut self, _url: &str) -> Result<(), String> {
            Err("GStreamer player not supported on this platform".into())
        }
        pub fn stop(&mut self) { self.running.store(false, Ordering::SeqCst); }
        pub fn is_running(&self) -> bool { false }
    }
}

#[cfg(not(target_os = "linux"))]
use stub::*;

// ── Cross‑platform API ─────────────────────────────────────────

fn platform_json() -> &'static str {
    if cfg!(target_os = "linux") { r#"{"platform":"linux"}"# }
    else if cfg!(target_os = "windows") { r#"{"platform":"windows"}"# }
    else { r#"{"platform":"macos"}"# }
}

#[allow(dead_code)]
pub struct AppProxy {
    pub port: u16,
    pub player: Arc<Mutex<Option<HlsPlayer>>>,
    _http_thread: Option<thread::JoinHandle<()>>,
}

impl AppProxy {
    pub fn start() -> Result<Self, String> {
        #[cfg(target_os = "linux")]
        let _ = gstreamer_init();

        let player: Arc<Mutex<Option<HlsPlayer>>> = Arc::new(Mutex::new(None));
        let port = find_free_port(8090).ok_or("no free port")?;
        let p = player.clone();
        let running = Arc::new(AtomicBool::new(true));
        let r = running.clone();

        let http_thread = thread::spawn(move || {
            let addr = format!("127.0.0.1:{port}");
            let server = match Server::http(&addr) {
                Ok(s) => s,
                Err(e) => { eprintln!("[Proxy] HTTP server failed: {e}"); return; }
            };
            for req in server.incoming_requests() {
                if !r.load(Ordering::SeqCst) { break; }
                let _ = panic::catch_unwind(panic::AssertUnwindSafe(|| {
                    handle_request(req, &p);
                }));
            }
        });

        Ok(AppProxy { port, player, _http_thread: Some(http_thread) })
    }
}

fn handle_request(mut req: tiny_http::Request, player: &Arc<Mutex<Option<HlsPlayer>>>) {
    let url = req.url().to_string();
    let method = req.method().to_string();

    // CORS preflight — respond immediately
    if method == "OPTIONS" {
        let _ = req.respond(cors_ok());
        return;
    }

    let res = match (method.as_str(), url.as_str()) {
        ("GET", "/health") => json(200, r#"{"status":"ok"}"#),
        ("GET", "/api/status") => json(200, platform_json()),

        ("POST", "/api/player/start") => {
            let mut body = String::new();
            let _ = req.as_reader().read_to_string(&mut body);
            let hls_url: String = serde_json::from_str(&body).ok()
                .and_then(|v: serde_json::Value| v.get("url").and_then(|u| u.as_str().map(String::from)))
                .unwrap_or_default();
            if hls_url.is_empty() { json(400, r#"{"error":"missing url"}"#) }
            else if let Ok(mut guard) = player.lock() {
                if let Some(old) = guard.take() { drop(old); }
                let mut hls = HlsPlayer::new();
                match hls.start(&hls_url) {
                    Ok(()) => { *guard = Some(hls); json(200, r#"{"ok":true}"#) }
                    Err(e) => json(500, &format!(r#"{{"error":"{e}"}}"#)),
                }
            } else { json(500, r#"{"error":"lock failed"}"#) }
        }

        ("POST", "/api/player/stop") => {
            if let Ok(mut guard) = player.lock() { *guard = None; }
            json(200, r#"{"ok":true}"#)
        }

        ("GET", p) if p.starts_with("/api/snapshot") => {
            let hls_url = p.split("?url=").nth(1).map(url_decode).unwrap_or_default();
            match snapshot_one(&hls_url) {
                Ok(jpeg) => {
                    let b64 = base64_encode(&jpeg);
                    json(200, &format!(r#"{{"data":"data:image/jpeg;base64,{b64}"}}"#))
                }
                Err(e) => json(500, &format!(r#"{{"error":"{e}"}}"#)),
            }
        }

    #[cfg(target_os = "linux")]
    ("GET", p) if p == "/stream" || p.starts_with("/stream?") => {
        if let Ok(guard) = player.lock() {
            if let Some(ref hls) = *guard {
                if hls.is_running() { let r = stream_mjpeg(hls); let _ = req.respond(r); return; }
            }
        }
        json(503, r#"{"error":"player not running"}"#)
    }

    #[cfg(not(target_os = "linux"))]
    ("GET", p) if p == "/stream" || p.starts_with("/stream?") =>
        json(503, r#"{"error":"streaming not supported on this platform"}"#),

    _ => json(404, r#"{"error":"not found"}"#),
    };
    let _ = req.respond(res);
}

// ── Helpers ─────────────────────────────────────────────────────

#[cfg(target_os = "linux")]
fn gstreamer_init() { std::thread::spawn(|| { let _ = gstreamer::init(); }); }

fn json(status: u16, body: &str) -> ResponseBox {
    let mut h = Vec::new();
    h.push(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
    h.push(Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
    h.push(Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, OPTIONS"[..]).unwrap());
    h.push(Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap());
    Response::new(StatusCode(status), h, Box::new(std::io::Cursor::new(body.as_bytes().to_vec())), None, None).boxed()
}

fn cors_ok() -> ResponseBox {
    let mut h = Vec::new();
    h.push(Header::from_bytes(&b"Content-Type"[..], &b"text/plain"[..]).unwrap());
    h.push(Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
    h.push(Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, OPTIONS"[..]).unwrap());
    h.push(Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap());
    Response::new(StatusCode(200), h, Box::new(std::io::Cursor::new(Vec::new())), Some(0), None).boxed()
}

fn base64_encode(bytes: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut r = String::with_capacity(bytes.len() * 4 / 3 + 4);
    for chunk in bytes.chunks(3) {
        let t = (chunk[0] as u32) << 16 | (chunk.get(1).copied().unwrap_or(0) as u32) << 8 | chunk.get(2).copied().unwrap_or(0) as u32;
        r.push(CHARS[((t >> 18) & 0x3F) as usize] as char);
        r.push(CHARS[((t >> 12) & 0x3F) as usize] as char);
        r.push(if chunk.len() > 1 { CHARS[((t >> 6) & 0x3F) as usize] as char } else { '=' });
        r.push(if chunk.len() > 2 { CHARS[(t & 0x3F) as usize] as char } else { '=' });
    }
    r
}

fn url_decode(s: &str) -> String {
    s.replace("%3A", ":").replace("%2F", "/").replace("%3F", "?")
     .replace("%3D", "=").replace("%26", "&").replace("%23", "#")
}

// ── MJPEG streamer (Linux only) ─────────────────────────────────

#[cfg(target_os = "linux")]
fn stream_mjpeg(hls: &HlsPlayer) -> tiny_http::Response<impl std::io::Read + Send> {
    use std::io::Read;
    const BOUNDARY: &str = "GStreamerMJPEGBoundary";

    struct MjpegStreamer {
        frame: Arc<Mutex<Vec<u8>>>, running: Arc<AtomicBool>,
        boundary: Vec<u8>, part_buf: Vec<u8>, part_pos: usize, first_frame: bool,
    }
    impl Read for MjpegStreamer {
        fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
            if !self.running.load(Ordering::SeqCst) { return Ok(0); }
            while self.part_pos >= self.part_buf.len() {
                if !self.next_chunk() { return Ok(0); }
            }
            let n = std::cmp::min(buf.len(), self.part_buf.len() - self.part_pos);
            buf[..n].copy_from_slice(&self.part_buf[self.part_pos..self.part_pos + n]);
            self.part_pos += n;
            Ok(n)
        }
    }
    impl MjpegStreamer {
        fn new(frame: Arc<Mutex<Vec<u8>>>, running: Arc<AtomicBool>) -> Self {
            MjpegStreamer { frame, running, boundary: BOUNDARY.as_bytes().to_vec(), part_buf: Vec::new(), part_pos: 0, first_frame: true }
        }
        fn next_chunk(&mut self) -> bool {
            for _ in 0..150 {
                if !self.running.load(Ordering::SeqCst) { return false; }
                let data = self.frame.try_lock().ok().and_then(|g| if g.is_empty() { None } else { Some(g.clone()) });
                if let Some(img) = data {
                    self.part_buf.clear();
                    if !self.first_frame { self.part_buf.extend_from_slice(b"\r\n"); }
                    self.first_frame = false;
                    self.part_buf.extend_from_slice(b"--"); self.part_buf.extend_from_slice(&self.boundary);
                    self.part_buf.extend_from_slice(b"\r\nContent-Type: image/jpeg\r\nContent-Length: ");
                    self.part_buf.extend_from_slice(img.len().to_string().as_bytes());
                    self.part_buf.extend_from_slice(b"\r\n\r\n"); self.part_buf.extend_from_slice(&img);
                    self.part_pos = 0; return true;
                }
                thread::sleep(Duration::from_millis(100));
            }
            false
        }
    }

    let streamer = MjpegStreamer::new(hls.latest_frame.clone(), hls.running.clone());
    let ct = format!("multipart/x-mixed-replace; boundary={BOUNDARY}");
    let mut headers = Vec::new();
    headers.push(tiny_http::Header::from_bytes(&b"Content-Type"[..], ct.as_bytes()).unwrap());
    headers.push(tiny_http::Header::from_bytes(&b"Cache-Control"[..], &b"no-cache"[..]).unwrap());
    tiny_http::Response::new(tiny_http::StatusCode(200), headers, streamer, None, None)
}

fn find_free_port(start: u16) -> Option<u16> {
    (start..start + 100).find(|port| std::net::TcpListener::bind(format!("127.0.0.1:{port}")).is_ok())
}
