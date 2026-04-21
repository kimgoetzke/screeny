pub mod decode;
pub mod encode;

/// Events streamed from the Rust decode backend to the frontend via a Tauri Channel.
///
/// JSON shape (adjacently tagged):
/// `{ "type": "start",    "data": { "totalBytes": N, "totalFrames": N } }`
/// `{ "type": "progress", "data": { "bytesRead": N, "totalBytes": N } }`
/// `{ "type": "frame",    "data": { "id": "...", "imageData": "...", ... } }`
/// `{ "type": "complete", "data": { "frameCount": N } }`
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", content = "data", rename_all = "camelCase")]
pub enum DecodeEvent {
    Start {
        #[serde(rename = "totalBytes")]
        total_bytes: u64,
        #[serde(rename = "totalFrames")]
        total_frames: usize,
    },
    Progress {
        #[serde(rename = "bytesRead")]
        bytes_read: u64,
        #[serde(rename = "totalBytes")]
        total_bytes: u64,
    },
    Frame(Frame),
    Complete {
        #[serde(rename = "frameCount")]
        frame_count: usize,
    },
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

#[cfg(test)]
mod tests {
    use super::DecodeEvent;

    #[test]
    fn progress_event_serializes_with_camel_case_fields() {
        let value = serde_json::to_value(DecodeEvent::Progress {
            bytes_read: 12,
            total_bytes: 24,
        })
        .unwrap();

        assert_eq!(
            value,
            serde_json::json!({
                "type": "progress",
                "data": {
                    "bytesRead": 12,
                    "totalBytes": 24
                }
            })
        );
    }

    #[test]
    fn start_event_serializes_with_camel_case_fields() {
        let value = serde_json::to_value(DecodeEvent::Start {
            total_bytes: 32,
            total_frames: 4,
        })
        .unwrap();

        assert_eq!(
            value,
            serde_json::json!({
                "type": "start",
                "data": {
                    "totalBytes": 32,
                    "totalFrames": 4
                }
            })
        );
    }
}
