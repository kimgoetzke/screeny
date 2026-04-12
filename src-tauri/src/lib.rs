mod dialog;
mod gif;

use std::path::PathBuf;

use gif::{ExportFrame, Frame};

#[tauri::command]
fn decode_gif(path: String) -> Result<Vec<Frame>, String> {
    gif::decode::decode_gif_file(&PathBuf::from(path))
}

#[tauri::command]
fn export_gif(frames: Vec<ExportFrame>, path: String) -> Result<(), String> {
    gif::encode::encode_gif_file(&frames, &PathBuf::from(path))
}

#[tauri::command]
async fn open_file_dialog() -> Result<Option<String>, String> {
    dialog::open_file().await
}

#[tauri::command]
async fn save_file_dialog() -> Result<Option<String>, String> {
    dialog::save_file().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            decode_gif,
            export_gif,
            open_file_dialog,
            save_file_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
