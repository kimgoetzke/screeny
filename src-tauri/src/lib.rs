mod e2e;
pub mod gif;

use std::path::PathBuf;

use gif::{ExportFrame, Frame};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            decode_gif,
            decode_gif_bytes,
            export_gif,
            suggest_export_path,
            e2e::e2e_check,
            e2e::e2e_open_fixture,
            e2e::e2e_save_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
