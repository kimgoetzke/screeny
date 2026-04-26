mod e2e;
pub mod gif;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use gif::ExportFrame;
use tauri::{ipc::Channel, window::Color, Manager};

struct AppState {
    decode_cancels: Mutex<HashMap<u64, Arc<AtomicBool>>>,
}

#[derive(serde::Serialize, Clone)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub extension: Option<String>,
}

#[tauri::command]
async fn decode_gif_stream(
    path: String,
    on_event: Channel<gif::DecodeEvent>,
    decode_id: u64,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let cancelled = Arc::new(AtomicBool::new(false));
    {
        let mut map = state.decode_cancels.lock().unwrap();
        map.insert(decode_id, cancelled.clone());
    }
    let path = PathBuf::from(path);
    let result = tauri::async_runtime::spawn_blocking(move || {
        gif::decode::decode_gif_stream_path(&path, &cancelled, |event| {
            on_event.send(event).ok();
        })
    })
    .await
    .map_err(|e| format!("Failed to join decode task: {e}"))?;
    {
        let mut map = state.decode_cancels.lock().unwrap();
        map.remove(&decode_id);
    }
    result
}

#[tauri::command]
fn cancel_gif_decode(decode_id: u64, state: tauri::State<'_, AppState>) {
    if let Some(flag) = state.decode_cancels.lock().unwrap().get(&decode_id) {
        flag.store(true, Ordering::Relaxed);
    }
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
fn home_dir() -> String {
    std::env::var("HOME").unwrap_or_else(|_| "/".to_string())
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let read_dir = std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory '{path}': {e}"))?;

    let mut entries: Vec<DirEntry> = read_dir
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().into_owned();
            // Skip hidden entries
            if name.starts_with('.') {
                return None;
            }
            let metadata = entry.metadata().ok()?;
            let is_dir = metadata.is_dir();
            let entry_path = entry.path().to_string_lossy().into_owned();
            let extension = entry
                .path()
                .extension()
                .map(|e| e.to_string_lossy().to_lowercase());
            // Include directories and .gif files only
            if is_dir || extension.as_deref() == Some("gif") {
                Some(DirEntry {
                    name,
                    path: entry_path,
                    is_dir,
                    extension,
                })
            } else {
                None
            }
        })
        .collect();

    // Sort: directories first, then alphabetically by name
    entries.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then_with(|| a.name.cmp(&b.name)));

    Ok(entries)
}

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    if !e2e::is_e2e_mode() {
        if let Some(window) = app.get_webview_window("splashscreen") {
            window.close().ok();
        }
    }
    // In E2E mode the splashscreen is left open so the test can inspect it.
    // e2e_close_splashscreen must be called explicitly to tear it down.
    if let Some(window) = app.get_webview_window("main") {
        window.show().ok();
    }
}

#[tauri::command]
fn e2e_close_splashscreen(app: tauri::AppHandle) -> Result<(), String> {
    if !e2e::is_e2e_mode() {
        return Err("Not in E2E mode".to_string());
    }
    if let Some(window) = app.get_webview_window("splashscreen") {
        window.close().ok();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            decode_cancels: Mutex::new(HashMap::new()),
        })
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let splashscreen_url = format!("splashscreen.html?version={}", env!("CARGO_PKG_VERSION"));
            tauri::WebviewWindowBuilder::new(
                app,
                "splashscreen",
                tauri::WebviewUrl::App(splashscreen_url.into()),
            )
            .title("screeny")
            .inner_size(360.0, 240.0)
            .resizable(false)
            .decorations(false)
            .center()
            .background_color(Color(0x19, 0x1a, 0x1c, 0xff))
            .build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            decode_gif_stream,
            cancel_gif_decode,
            export_gif,
            suggest_export_path,
            home_dir,
            list_dir,
            close_splashscreen,
            e2e_close_splashscreen,
            e2e::e2e_check,
            e2e::e2e_save_path,
            e2e::e2e_fixture_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn list_dir_returns_dirs_and_gif_files() {
        let dir = tempdir().unwrap();
        fs::create_dir(dir.path().join("subdir")).unwrap();
        fs::write(dir.path().join("animation.gif"), b"GIF89a").unwrap();
        fs::write(dir.path().join("image.png"), b"PNG").unwrap();
        fs::write(dir.path().join(".hidden"), b"").unwrap();

        let entries = list_dir(dir.path().to_str().unwrap().to_string()).unwrap();
        let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();

        assert!(names.contains(&"subdir"), "should include directory");
        assert!(names.contains(&"animation.gif"), "should include .gif file");
        assert!(!names.contains(&"image.png"), "should exclude .png file");
        assert!(!names.contains(&".hidden"), "should exclude hidden entries");
    }

    #[test]
    fn list_dir_sorts_dirs_before_files() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("aaa.gif"), b"GIF89a").unwrap();
        fs::create_dir(dir.path().join("zzz_dir")).unwrap();

        let entries = list_dir(dir.path().to_str().unwrap().to_string()).unwrap();

        assert!(entries[0].is_dir, "first entry should be a directory");
        assert!(!entries[1].is_dir, "second entry should be a file");
    }

    #[test]
    fn list_dir_errors_on_nonexistent_path() {
        let result = list_dir("/nonexistent/path/xyz123".to_string());
        assert!(result.is_err());
    }

}
