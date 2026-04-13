use std::path::Path;

use base64::{Engine, engine::general_purpose::STANDARD};
use image::codecs::png::PngEncoder;
use image::{ImageEncoder, RgbaImage};

use super::Frame;

/// Decode a GIF file into individual composited frames.
///
/// Each frame is fully composited (handling sub-rectangles and disposal methods)
/// and returned as a base64-encoded PNG data URL.
pub fn decode_gif_file(path: &Path) -> Result<Vec<Frame>, String> {
    let file = std::fs::File::open(path).map_err(|e| format!("Failed to open file: {e}"))?;

    let mut options = gif::DecodeOptions::new();
    options.set_color_output(gif::ColorOutput::RGBA);
    let mut decoder = options
        .read_info(file)
        .map_err(|e| format!("Failed to read GIF: {e}"))?;

    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let canvas_size = (width * height * 4) as usize;

    let mut canvas = vec![0u8; canvas_size];
    let mut previous_canvas = vec![0u8; canvas_size];
    let mut frames = Vec::new();

    while let Some(frame) = decoder
        .read_next_frame()
        .map_err(|e| format!("Failed to read frame: {e}"))?
    {
        // Save canvas before compositing if disposal is RestoreToPrevious
        if frame.dispose == gif::DisposalMethod::Previous {
            previous_canvas.copy_from_slice(&canvas);
        }

        // Composite frame onto canvas
        composite_frame(&mut canvas, width, frame);

        // Encode composited canvas as PNG
        let image_data = encode_canvas_as_data_url(&canvas, width, height)?;

        // GIF delay is in hundredths of a second; convert to milliseconds
        let duration = (frame.delay as u32) * 10;

        frames.push(Frame {
            id: format!("frame-{}", frames.len()),
            image_data,
            duration,
            width,
            height,
        });

        // Apply disposal method for next frame
        match frame.dispose {
            gif::DisposalMethod::Background => {
                clear_frame_area(&mut canvas, width, frame);
            }
            gif::DisposalMethod::Previous => {
                canvas.copy_from_slice(&previous_canvas);
            }
            _ => {} // Keep / Any — leave canvas as-is
        }
    }

    Ok(frames)
}

/// Decode a GIF from an in-memory byte slice.
pub fn decode_gif_bytes(data: &[u8]) -> Result<Vec<Frame>, String> {
    let reader = std::io::Cursor::new(data);

    let mut options = gif::DecodeOptions::new();
    options.set_color_output(gif::ColorOutput::RGBA);
    let mut decoder = options
        .read_info(reader)
        .map_err(|e| format!("Failed to read GIF: {e}"))?;

    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let canvas_size = (width * height * 4) as usize;

    let mut canvas = vec![0u8; canvas_size];
    let mut previous_canvas = vec![0u8; canvas_size];
    let mut frames = Vec::new();

    while let Some(frame) = decoder
        .read_next_frame()
        .map_err(|e| format!("Failed to read frame: {e}"))?
    {
        if frame.dispose == gif::DisposalMethod::Previous {
            previous_canvas.copy_from_slice(&canvas);
        }

        composite_frame(&mut canvas, width, frame);

        let image_data = encode_canvas_as_data_url(&canvas, width, height)?;
        let duration = (frame.delay as u32) * 10;

        frames.push(Frame {
            id: format!("frame-{}", frames.len()),
            image_data,
            duration,
            width,
            height,
        });

        match frame.dispose {
            gif::DisposalMethod::Background => {
                clear_frame_area(&mut canvas, width, frame);
            }
            gif::DisposalMethod::Previous => {
                canvas.copy_from_slice(&previous_canvas);
            }
            _ => {}
        }
    }

    Ok(frames)
}

fn composite_frame(canvas: &mut [u8], canvas_width: u32, frame: &gif::Frame) {
    let frame_left = frame.left as usize;
    let frame_top = frame.top as usize;
    let frame_width = frame.width as usize;
    let frame_height = frame.height as usize;
    let canvas_width = canvas_width as usize;

    for y in 0..frame_height {
        for x in 0..frame_width {
            let src_idx = (y * frame_width + x) * 4;
            let dst_idx = ((frame_top + y) * canvas_width + (frame_left + x)) * 4;

            // Only composite non-transparent pixels
            if frame.buffer[src_idx + 3] > 0 {
                canvas[dst_idx..dst_idx + 4].copy_from_slice(&frame.buffer[src_idx..src_idx + 4]);
            }
        }
    }
}

fn clear_frame_area(canvas: &mut [u8], canvas_width: u32, frame: &gif::Frame) {
    let frame_left = frame.left as usize;
    let frame_top = frame.top as usize;
    let frame_width = frame.width as usize;
    let frame_height = frame.height as usize;
    let canvas_width = canvas_width as usize;

    for y in 0..frame_height {
        for x in 0..frame_width {
            let idx = ((frame_top + y) * canvas_width + (frame_left + x)) * 4;
            canvas[idx..idx + 4].copy_from_slice(&[0, 0, 0, 0]);
        }
    }
}

fn encode_canvas_as_data_url(canvas: &[u8], width: u32, height: u32) -> Result<String, String> {
    let img = RgbaImage::from_raw(width, height, canvas.to_vec())
        .ok_or("Failed to create image from canvas")?;

    let mut png_bytes = Vec::new();
    PngEncoder::new(&mut png_bytes)
        .write_image(img.as_raw(), width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| format!("Failed to encode PNG: {e}"))?;

    let b64 = STANDARD.encode(&png_bytes);
    Ok(format!("data:image/png;base64,{b64}"))
}

/// Decode a base64 PNG data URL back to RGBA pixels.
pub fn decode_data_url_to_rgba(data_url: &str) -> Result<RgbaImage, String> {
    let b64 = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or("Invalid data URL format")?;

    let png_bytes = STANDARD
        .decode(b64)
        .map_err(|e| format!("Failed to decode base64: {e}"))?;

    let img = image::load_from_memory_with_format(&png_bytes, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to decode PNG: {e}"))?;

    Ok(img.to_rgba8())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Create a simple test GIF with solid-colour frames.
    fn create_test_gif(frame_colours: &[[u8; 4]], width: u16, height: u16, delay: u16) -> Vec<u8> {
        let mut buf = Vec::new();
        {
            let mut encoder = gif::Encoder::new(&mut buf, width, height, &[]).unwrap();
            encoder.set_repeat(gif::Repeat::Infinite).unwrap();
            for colour in frame_colours {
                let pixel_count = (width as usize) * (height as usize);
                let mut pixels: Vec<u8> = Vec::with_capacity(pixel_count * 4);
                for _ in 0..pixel_count {
                    pixels.extend_from_slice(colour);
                }
                let mut frame = gif::Frame::from_rgba_speed(width, height, &mut pixels, 10);
                frame.delay = delay;
                encoder.write_frame(&frame).unwrap();
            }
        }
        buf
    }

    #[test]
    fn test_decode_frame_count() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255]],
            4,
            4,
            10,
        );

        let frames = decode_gif_bytes(&gif_data).unwrap();
        assert_eq!(frames.len(), 2);
    }

    #[test]
    fn test_decode_frame_dimensions() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 8, 6, 5);

        let frames = decode_gif_bytes(&gif_data).unwrap();
        assert_eq!(frames[0].width, 8);
        assert_eq!(frames[0].height, 6);
    }

    #[test]
    fn test_decode_frame_duration() {
        // delay=10 means 10 hundredths of a second = 100ms
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 10);

        let frames = decode_gif_bytes(&gif_data).unwrap();
        assert_eq!(frames[0].duration, 100);
    }

    #[test]
    fn test_decode_frame_ids_are_sequential() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
            2,
            2,
            5,
        );

        let frames = decode_gif_bytes(&gif_data).unwrap();
        assert_eq!(frames[0].id, "frame-0");
        assert_eq!(frames[1].id, "frame-1");
        assert_eq!(frames[2].id, "frame-2");
    }

    #[test]
    fn test_decode_produces_valid_data_urls() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 5);

        let frames = decode_gif_bytes(&gif_data).unwrap();
        assert!(frames[0].image_data.starts_with("data:image/png;base64,"));
    }

    #[test]
    fn test_data_url_round_trip() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 5);
        let frames = decode_gif_bytes(&gif_data).unwrap();

        // Decode the data URL back to RGBA
        let rgba = decode_data_url_to_rgba(&frames[0].image_data).unwrap();
        assert_eq!(rgba.width(), 2);
        assert_eq!(rgba.height(), 2);

        // All pixels should be close to red (quantisation may shift values slightly)
        let pixel = rgba.get_pixel(0, 0);
        assert!(pixel[0] > 200, "Red channel should be high, got {}", pixel[0]);
        assert!(pixel[3] == 255, "Alpha should be 255");
    }
}
