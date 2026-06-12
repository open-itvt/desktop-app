use tauri::Manager;

mod player;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let proxy = player::AppProxy::start().expect("failed to start proxy");
    let proxy_port = proxy.port;

    eprintln!("[iTVT] Proxy on port {proxy_port}");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(debug_assertions)]
            let base_url = "http://localhost:1420";
            #[cfg(not(debug_assertions))]
            let base_url = "https://desktop-app.itvt.xyz";

            if let Ok(url) = format!("{base_url}?proxy={proxy_port}").parse() {
                let _ = window.navigate(url);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
