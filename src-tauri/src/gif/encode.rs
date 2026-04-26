use std::fs::File;
use std::path::Path;

use base64::{Engine, engine::general_purpose::STANDARD};

use super::ExportFrame;

/// Encode frames into a GIF file using gifski.
pub fn encode_gif_file(frames: &[ExportFrame], output_path: &Path) -> Result<(), String> {
    if frames.is_empty() {
        return Err("No frames to export".to_string());
    }

    let width = frames[0].width;
    let height = frames[0].height;

    let settings = gifski::Settings {
        width: Some(width),
        height: Some(height),
        quality: 90,
        fast: false,
        repeat: gifski::Repeat::Infinite,
    };

    let (collector, writer) = gifski::new(settings).map_err(|e| format!("Failed to init gifski: {e}"))?;

    let output_path = output_path.to_owned();
    let write_thread = std::thread::spawn(move || -> Result<(), String> {
        let file = File::create(&output_path)
            .map_err(|e| format!("Failed to create output file: {e}"))?;
        writer
            .write(file, &mut gifski::progress::NoProgress {})
            .map_err(|e| format!("Failed to write GIF: {e}"))
    });

    let mut timestamp = 0.0;
    for (i, frame) in frames.iter().enumerate() {
        let raw = STANDARD
            .decode(&frame.image_data)
            .map_err(|e| format!("Failed to decode frame {i}: {e}"))?;

        let pixels: Vec<rgb::RGBA8> = raw
            .chunks_exact(4)
            .map(|c| rgb::RGBA8::new(c[0], c[1], c[2], c[3]))
            .collect();

        let img = imgref::ImgVec::new(pixels, frame.width as usize, frame.height as usize);

        collector
            .add_frame_rgba(i, img, timestamp)
            .map_err(|e| format!("Failed to add frame {i}: {e}"))?;

        timestamp += frame.duration as f64 / 1000.0;
    }

    // Signal no more frames
    drop(collector);

    write_thread
        .join()
        .map_err(|_| "Writer thread panicked".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::gif::DecodeEvent;
    use crate::gif::decode::decode_gif_stream_path;
    use tempfile::NamedTempFile;

    /// Decode all frames from a file path using the streaming API.
    fn decode_all_frames(path: &std::path::Path) -> Vec<crate::gif::Frame> {
        let not_cancelled = std::sync::atomic::AtomicBool::new(false);
        let mut frames = Vec::new();
        decode_gif_stream_path(path, &not_cancelled, |event| {
            if let DecodeEvent::Frame(frame) = event {
                frames.push(frame);
            }
        })
        .unwrap();
        frames
    }

    /// Create an ExportFrame from a solid RGBA colour using raw RGBA base64.
    fn make_export_frame(colour: [u8; 4], width: u32, height: u32, duration: u32) -> ExportFrame {
        let pixel_count = (width * height) as usize;
        let mut pixels = Vec::with_capacity(pixel_count * 4);
        for _ in 0..pixel_count {
            pixels.extend_from_slice(&colour);
        }
        ExportFrame {
            image_data: STANDARD.encode(&pixels),
            duration,
            width,
            height,
        }
    }

    #[test]
    fn test_encode_single_frame() {
        let frame = make_export_frame([255, 0, 0, 255], 4, 4, 100);
        let output = NamedTempFile::new().unwrap();

        encode_gif_file(&[frame], output.path()).unwrap();

        // Verify the output is a valid GIF by decoding it
        let decoded = decode_all_frames(output.path());
        assert_eq!(decoded.len(), 1);
        assert_eq!(decoded[0].width, 4);
        assert_eq!(decoded[0].height, 4);
    }

    #[test]
    fn test_encode_multiple_frames() {
        let frames = vec![
            make_export_frame([255, 0, 0, 255], 4, 4, 100),
            make_export_frame([0, 255, 0, 255], 4, 4, 200),
        ];
        let output = NamedTempFile::new().unwrap();

        encode_gif_file(&frames, output.path()).unwrap();

        let decoded = decode_all_frames(output.path());
        assert_eq!(decoded.len(), 2);
    }

    #[test]
    fn test_encode_empty_frames_errors() {
        let output = NamedTempFile::new().unwrap();
        let result = encode_gif_file(&[], output.path());
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "No frames to export");
    }
}
