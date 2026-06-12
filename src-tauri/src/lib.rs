use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::Manager;

mod player;
use player::HlsPlayer;

struct PlayerState(Mutex<Option<HlsPlayer>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn capture_snapshot(url: &str) -> Result<String, String> {
    let jpeg = player::snapshot_one(url)?;
    let b64 = base64_encode(&jpeg);
    Ok(format!("data:image/jpeg;base64,{b64}"))
}

#[tauri::command]
fn start_player(state: tauri::State<'_, PlayerState>, url: &str) -> Result<u16, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        if let Some(old) = guard.take() {
            drop(old);
            thread::sleep(Duration::from_millis(200));
        }
    }

    let mut hls = HlsPlayer::new();
    let port = hls.start(url)?;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(hls);
    Ok(port)
}

#[tauri::command]
fn stop_player(state: tauri::State<'_, PlayerState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(old) = guard.take() {
        drop(old);
    }
    Ok(())
}

fn base64_encode(bytes: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity(bytes.len() * 4 / 3 + 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::thread::spawn(|| {
        let _ = gstreamer::init();
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(PlayerState(Mutex::new(None)))
        .setup(|_app| {
            #[cfg(not(debug_assertions))]
            {
                let window = _app.get_webview_window("main").unwrap();
                let url = "https://desktop-app.itvt.xyz"
                    .parse()
                    .expect("invalid URL");
                window.navigate(url).ok();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            capture_snapshot,
            start_player,
            stop_player
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
