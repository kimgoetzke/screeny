mod e2e;
pub mod gif;

use std::path::PathBuf;

use gif::{ExportFrame, Frame};
use tauri::{window::Color, Manager};

#[tauri::command]
fn decode_gif(path: String) -> Result<Vec<Frame>, String> {
    gif::decode::decode_gif_file(&PathBuf::from(path))
}

#[tauri::command]
fn decode_gif_bytes(data: Vec<u8>) -> Result<Vec<Frame>, String> {
    gif::decode::decode_gif_bytes(&data)
}

#[tauri::command]
fn export_gif(frames: Vec<ExportFrame>, path: String) -> Result<(), String> {
    gif::encode::encode_gif_file(&frames, &PathBuf::from(path))
}

#[tauri::command]
fn suggest_export_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    format!("{home}/export.gif")
}

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("splashscreen") {
        window.close().ok();
    }
    if let Some(window) = app.get_webview_window("main") {
        window.show().ok();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            tauri::WebviewWindowBuilder::new(
                app,
                "splashscreen",
                tauri::WebviewUrl::App("splashscreen.html".into()),
            )
            .title("screeny")
            .inner_size(360.0, 240.0)
            .resizable(false)
            .center()
            .background_color(Color(0x19, 0x1a, 0x1c, 0xff))
            .build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            decode_gif,
            decode_gif_bytes,
            export_gif,
            suggest_export_path,
            close_splashscreen,
            e2e::e2e_check,
            e2e::e2e_open_fixture,
            e2e::e2e_save_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
