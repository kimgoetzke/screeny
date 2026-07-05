mod e2e;
pub mod gif;
#[cfg(test)]
mod testing;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use gif::ExportFrame;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{ipc::Channel, window::Color, Manager};

struct AppState {
    decode_cancels: Mutex<HashMap<u64, Arc<AtomicBool>>>,
}

fn register_decode_session(
    map: &mut HashMap<u64, Arc<AtomicBool>>,
    decode_id: u64,
    cancelled: Arc<AtomicBool>,
) -> Result<(), String> {
    if map.contains_key(&decode_id) {
        return Err(format!("Decode session {decode_id} already in progress"));
    }
    map.insert(decode_id, cancelled);
    Ok(())
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
        let mut map = state
            .decode_cancels
            .lock()
            .map_err(|e| format!("State lock poisoned: {e}"))?;
        register_decode_session(&mut map, decode_id, cancelled.clone())?;
    }
    let path = PathBuf::from(path);
    let result = tauri::async_runtime::spawn_blocking(move || {
        gif::decode::decode_gif_stream_path(&path, &cancelled, |event| {
            if on_event.send(event).is_err() {
                cancelled.store(true, Ordering::Relaxed);
            }
        })
    })
    .await;
    {
        let mut map = state
            .decode_cancels
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        map.remove(&decode_id);
    }
    result.map_err(|e| format!("Failed to join decode task: {e}"))?
}

#[tauri::command]
fn cancel_gif_decode(decode_id: u64, state: tauri::State<'_, AppState>) {
    if let Some(flag) = state
        .decode_cancels
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .get(&decode_id)
    {
        flag.store(true, Ordering::Relaxed);
    }
}

fn decode_image_path(path: &Path) -> Result<gif::Frame, String> {
    let image = image::ImageReader::open(path)
        .map_err(|e| format!("Failed to open image '{}': {e}", path.display()))?
        .decode()
        .map_err(|e| format!("Failed to decode image '{}': {e}", path.display()))?
        .to_rgba8();
    let (width, height) = image.dimensions();
    let id = path
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.to_string_lossy().into_owned());

    Ok(gif::Frame {
        id,
        image_data: STANDARD.encode(image.as_raw()),
        duration: 100,
        width,
        height,
    })
}

#[tauri::command]
fn decode_image_frame(path: String) -> Result<gif::Frame, String> {
    decode_image_path(&PathBuf::from(path))
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

fn is_openable_extension(extension: &str) -> bool {
    extension == "gif"
}

fn is_importable_extension(extension: &str) -> bool {
    matches!(extension, "gif" | "png" | "jpg" | "jpeg")
}

fn list_dir_entries(
    path: &str,
    accepts_extension: fn(&str) -> bool,
) -> Result<Vec<DirEntry>, String> {
    let read_dir =
        std::fs::read_dir(path).map_err(|e| format!("Failed to read directory '{path}': {e}"))?;

    let mut entries: Vec<DirEntry> = read_dir
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().into_owned();
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
            if is_dir || extension.as_deref().is_some_and(accepts_extension) {
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

    entries.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then_with(|| a.name.cmp(&b.name)));

    Ok(entries)
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    list_dir_entries(&path, is_openable_extension)
}

#[tauri::command]
fn list_import_dir(path: String) -> Result<Vec<DirEntry>, String> {
    list_dir_entries(&path, is_importable_extension)
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
            let splashscreen_url =
                format!("splashscreen.html?version={}", env!("CARGO_PKG_VERSION"));
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
            decode_image_frame,
            export_gif,
            suggest_export_path,
            home_dir,
            list_dir,
            list_import_dir,
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
    use base64::engine::general_purpose::STANDARD;
    use image::Rgba;
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
    fn list_import_dir_returns_dirs_gif_and_static_image_files() {
        let dir = tempdir().unwrap();
        fs::create_dir(dir.path().join("subdir")).unwrap();
        fs::write(dir.path().join("animation.gif"), b"GIF89a").unwrap();
        fs::write(dir.path().join("image.png"), b"PNG").unwrap();
        fs::write(dir.path().join("photo.jpg"), b"JPG").unwrap();
        fs::write(dir.path().join("notes.txt"), b"text").unwrap();

        let entries = list_import_dir(dir.path().to_str().unwrap().to_string()).unwrap();
        let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();

        assert!(names.contains(&"subdir"), "should include directory");
        assert!(names.contains(&"animation.gif"), "should include .gif file");
        assert!(names.contains(&"image.png"), "should include .png file");
        assert!(names.contains(&"photo.jpg"), "should include .jpg file");
        assert!(
            !names.contains(&"notes.txt"),
            "should exclude non-importable file"
        );
    }

    #[test]
    fn decode_image_path_returns_static_image_as_raw_rgba_frame() {
        let dir = tempdir().unwrap();
        let png_path = dir.path().join("red.png");
        RgbaImage::from_pixel(1, 1, Rgba([255, 0, 0, 255]))
            .save(&png_path)
            .unwrap();

        let frame = decode_image_path(&png_path).unwrap();
        let rgba = STANDARD.decode(&frame.image_data).unwrap();

        assert_eq!(frame.id, "red.png");
        assert_eq!(frame.width, 1);
        assert_eq!(frame.height, 1);
        assert_eq!(frame.duration, 100);
        assert_eq!(rgba, vec![255, 0, 0, 255]);
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

    #[test]
    fn register_decode_session_succeeds_for_new_id() {
        let mut map = HashMap::new();
        let flag = Arc::new(AtomicBool::new(false));
        let result = register_decode_session(&mut map, 1, flag);
        assert!(result.is_ok());
        assert!(map.contains_key(&1));
    }

    #[test]
    fn register_decode_session_rejects_duplicate_id() {
        let mut map = HashMap::new();
        let flag1 = Arc::new(AtomicBool::new(false));
        let flag2 = Arc::new(AtomicBool::new(false));
        register_decode_session(&mut map, 42, flag1).unwrap();
        let result = register_decode_session(&mut map, 42, flag2);
        assert!(result.is_err());
        assert!(
            result.unwrap_err().contains("42"),
            "error should mention the duplicate decode_id"
        );
    }

    #[test]
    fn register_decode_session_allows_id_reuse_after_cleanup() {
        let mut map = HashMap::new();
        register_decode_session(&mut map, 7, Arc::new(AtomicBool::new(false))).unwrap();
        map.remove(&7);
        let result = register_decode_session(&mut map, 7, Arc::new(AtomicBool::new(false)));
        assert!(
            result.is_ok(),
            "same decode_id should be accepted after the prior session is cleaned up"
        );
    }
}
