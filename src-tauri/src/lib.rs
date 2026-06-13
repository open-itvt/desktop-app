use std::sync::atomic::AtomicU16;
use tauri::Manager;

mod player;

struct ProxyPort(AtomicU16);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let proxy = player::AppProxy::start().expect("failed to start proxy");
    let proxy_port = proxy.port;
    eprintln!("[iTVT] Proxy on port {proxy_port}");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(ProxyPort(AtomicU16::new(proxy_port)))
        .setup(move |app| {
            let _window = app.get_webview_window("main").unwrap();
            // Don't navigate — load the embedded default `index.html`
            // The frontend calls get_proxy_port via IPC to discover the proxy
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_proxy_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_proxy_port(state: tauri::State<'_, ProxyPort>) -> Result<u16, String> {
    Ok(state.0.load(std::sync::atomic::Ordering::Relaxed))
}
