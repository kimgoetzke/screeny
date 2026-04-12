use ashpd::desktop::file_chooser::{FileFilter, OpenFileRequest, SaveFileRequest};

/// Open a file dialog via xdg-desktop-portal and return the selected path.
pub async fn open_file() -> Result<Option<String>, String> {
    let response = OpenFileRequest::default()
        .title("Open GIF")
        .accept_label("Open")
        .modal(true)
        .multiple(false)
        .filter(FileFilter::new("GIF").glob("*.gif"))
        .send()
        .await
        .map_err(|e| format!("Failed to send open dialog request: {e}"))?
        .response()
        .map_err(|e| format!("Open dialog failed: {e}"))?;

    let uris = response.uris();
    if uris.is_empty() {
        return Ok(None);
    }

    let uri = &uris[0];
    uri.to_file_path()
        .map(|p| Some(p.to_string_lossy().to_string()))
        .map_err(|_| format!("Invalid file URI: {uri}"))
}

/// Open a save dialog via xdg-desktop-portal and return the selected path.
pub async fn save_file() -> Result<Option<String>, String> {
    let response = SaveFileRequest::default()
        .title("Export GIF")
        .accept_label("Export")
        .modal(true)
        .current_name("export.gif")
        .filter(FileFilter::new("GIF").glob("*.gif"))
        .send()
        .await
        .map_err(|e| format!("Failed to send save dialog request: {e}"))?
        .response()
        .map_err(|e| format!("Save dialog failed: {e}"))?;

    let uris = response.uris();
    if uris.is_empty() {
        return Ok(None);
    }

    let uri = &uris[0];
    uri.to_file_path()
        .map(|p| Some(p.to_string_lossy().to_string()))
        .map_err(|_| format!("Invalid file URI: {uri}"))
}
