pub mod decode;
pub mod encode;

/// Events streamed from the Rust decode backend to the frontend via a Tauri Channel.
///
/// JSON shape (adjacently tagged):
/// `{ "type": "progress", "data": { "bytesRead": N, "totalBytes": N } }`
/// `{ "type": "frame",    "data": { "id": "...", "imageData": "...", ... } }`
/// `{ "type": "complete", "data": { "frameCount": N } }`
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", content = "data", rename_all = "camelCase")]
pub enum DecodeEvent {
    Progress { bytes_read: u64, total_bytes: u64 },
    Frame(Frame),
    Complete { frame_count: usize },
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub id: String,
    pub image_data: String,
    pub duration: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportFrame {
    pub image_data: String,
    pub duration: u32,
}
