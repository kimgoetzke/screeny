use base64::{engine::general_purpose::STANDARD, Engine};
use std::fs::File;
use std::path::Path;

use super::ExportFrame;

/// Encode frames into a GIF file using gifski.
pub fn encode_gif_file(frames: &[ExportFrame], output_path: &Path) -> Result<(), String> {
    if frames.is_empty() {
        return Err("No frames to export".to_string());
    }

    let width = frames[0].width;
    let height = frames[0].height;

    for (i, frame) in frames.iter().enumerate().skip(1) {
        if frame.width != width {
            return Err(format!(
                "Frame {i} width {} does not match frame 0 width {width}",
                frame.width
            ));
        }
        if frame.height != height {
            return Err(format!(
                "Frame {i} height {} does not match frame 0 height {height}",
                frame.height
            ));
        }
    }

    let settings = gifski::Settings {
        width: Some(width),
        height: Some(height),
        quality: 90,
        fast: false,
        repeat: gifski::Repeat::Infinite,
    };

    let (collector, writer) =
        gifski::new(settings).map_err(|e| format!("Failed to init gifski: {e}"))?;

    let output_path = output_path.to_owned();
    let write_thread = std::thread::spawn(move || -> Result<(), String> {
        let file =
            File::create(&output_path).map_err(|e| format!("Failed to create output file: {e}"))?;
        writer
            .write(file, &mut gifski::progress::NoProgress {})
            .map_err(|e| format!("Failed to write GIF: {e}"))
    });

    let expected_bytes = width as usize * height as usize * 4;
    let mut timestamp = 0.0;
    let mut encode_error: Option<String> = None;
    for (i, frame) in frames.iter().enumerate() {
        let raw = match STANDARD.decode(&frame.image_data) {
            Ok(r) => r,
            Err(e) => {
                encode_error = Some(format!("Failed to decode frame {i}: {e}"));
                break;
            }
        };

        if raw.len() != expected_bytes {
            encode_error = Some(format!(
                "Frame {i} has wrong data length: got {} bytes, expected {expected_bytes}",
                raw.len()
            ));
            break;
        }

        let pixels: Vec<rgb::RGBA8> = raw
            .chunks_exact(4)
            .map(|c| rgb::RGBA8::new(c[0], c[1], c[2], c[3]))
            .collect();

        let img = imgref::ImgVec::new(pixels, frame.width as usize, frame.height as usize);

        if let Err(e) = collector.add_frame_rgba(i, img, timestamp) {
            encode_error = Some(format!("Failed to add frame {i}: {e}"));
            break;
        }

        timestamp += frame.duration as f64 / 1000.0;
    }

    // Signal no more frames before joining so the write thread can finish
    drop(collector);

    let write_result = write_thread
        .join()
        .map_err(|_| "Writer thread panicked".to_string())?;

    if let Some(e) = encode_error {
        return Err(e);
    }

    write_result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::gif::decode::decode_gif_stream_path;
    use crate::gif::DecodeEvent;
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
    ///
    /// DUPLICATE: identical logic exists in `tests/generate_fixture.rs::make_export_frame`.
    /// Duplication is intentional: `generate_fixture.rs` compiles as a separate integration-test
    /// crate and cannot access `#[cfg(test)]` items from the lib without a feature flag.
    /// Any change to this function, its signature, or its location must be mirrored there,
    /// and both copies of this comment must be updated to reflect the new locations or names.
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

    #[test]
    fn encode_gif_file_rejects_mismatched_width() {
        let frame1 = make_export_frame([255, 0, 0, 255], 4, 4, 100);
        let frame2 = make_export_frame([0, 255, 0, 255], 8, 4, 100);
        let output = NamedTempFile::new().unwrap();

        let result = encode_gif_file(&[frame1, frame2], output.path());

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("width"),
            "expected error about width, got: {err}"
        );
    }

    #[test]
    fn encode_gif_file_rejects_mismatched_height() {
        let frame1 = make_export_frame([255, 0, 0, 255], 4, 4, 100);
        let frame2 = make_export_frame([0, 255, 0, 255], 4, 8, 100);
        let output = NamedTempFile::new().unwrap();

        let result = encode_gif_file(&[frame1, frame2], output.path());

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("height"),
            "expected error about height, got: {err}"
        );
    }

    #[test]
    fn encode_gif_file_rejects_wrong_rgba_length() {
        let mut frame = make_export_frame([255, 0, 0, 255], 4, 4, 100);
        // 4×4 frame needs 64 bytes; supply only 32
        frame.image_data = STANDARD.encode(vec![0u8; 32]);
        let output = NamedTempFile::new().unwrap();

        let result = encode_gif_file(&[frame], output.path());

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("data length") || err.contains("bytes"),
            "expected error about data length, got: {err}"
        );
    }
}
