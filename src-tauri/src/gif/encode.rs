use std::fs::File;
use std::path::Path;

use super::ExportFrame;
use super::decode::decode_data_url_to_rgba;

/// Encode frames into a GIF file using gifski.
pub fn encode_gif_file(frames: &[ExportFrame], output_path: &Path) -> Result<(), String> {
    if frames.is_empty() {
        return Err("No frames to export".to_string());
    }

    // Decode the first frame to get dimensions
    let first_rgba = decode_data_url_to_rgba(&frames[0].image_data)?;
    let width = first_rgba.width();
    let height = first_rgba.height();

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
        let rgba = decode_data_url_to_rgba(&frame.image_data)?;

        let pixels: Vec<rgb::RGBA8> = rgba
            .pixels()
            .map(|p| rgb::RGBA8::new(p[0], p[1], p[2], p[3]))
            .collect();

        let img = imgref::ImgVec::new(pixels, width as usize, height as usize);

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
    use crate::gif::decode::decode_gif_file;
    use tempfile::NamedTempFile;

    /// Create an ExportFrame from solid RGBA colour.
    fn make_export_frame(colour: [u8; 4], width: u32, height: u32, duration: u32) -> ExportFrame {
        use base64::{Engine, engine::general_purpose::STANDARD};
        use image::{RgbaImage, codecs::png::PngEncoder, ImageEncoder};

        let pixel_count = (width * height) as usize;
        let mut pixels = Vec::with_capacity(pixel_count * 4);
        for _ in 0..pixel_count {
            pixels.extend_from_slice(&colour);
        }

        let img = RgbaImage::from_raw(width, height, pixels).unwrap();
        let mut png_bytes = Vec::new();
        PngEncoder::new(&mut png_bytes)
            .write_image(img.as_raw(), width, height, image::ExtendedColorType::Rgba8)
            .unwrap();

        let b64 = STANDARD.encode(&png_bytes);
        ExportFrame {
            image_data: format!("data:image/png;base64,{b64}"),
            duration,
        }
    }

    #[test]
    fn test_encode_single_frame() {
        let frame = make_export_frame([255, 0, 0, 255], 4, 4, 100);
        let output = NamedTempFile::new().unwrap();

        encode_gif_file(&[frame], output.path()).unwrap();

        // Verify the output is a valid GIF by decoding it
        let decoded = decode_gif_file(output.path()).unwrap();
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

        let decoded = decode_gif_file(output.path()).unwrap();
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
