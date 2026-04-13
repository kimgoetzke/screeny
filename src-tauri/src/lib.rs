mod e2e;
pub mod gif;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            decode_gif,
            export_gif,
            e2e::e2e_check,
            e2e::e2e_open_fixture,
            e2e::e2e_save_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
