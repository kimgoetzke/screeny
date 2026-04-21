use std::io::Read;
use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use base64::{Engine, engine::general_purpose::STANDARD};
use image::codecs::png::PngEncoder;
use image::{ImageEncoder, RgbaImage};

use super::{DecodeEvent, Frame};

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

/// Wraps a [`Read`] implementor and tracks total bytes consumed via a shared atomic counter.
///
/// The decoder takes ownership of the reader, so the counter provides the only way to observe
/// progress from outside the decoder during streaming.
pub struct ProgressReader<R: Read> {
    inner: R,
    bytes_read: Arc<AtomicU64>,
}

impl<R: Read> ProgressReader<R> {
    /// Creates a new `ProgressReader` and returns a shared counter alongside it.
    /// The counter is updated on every `read()` call.
    pub fn new(inner: R, _total_bytes: u64) -> (Self, Arc<AtomicU64>) {
        let bytes_read = Arc::new(AtomicU64::new(0));
        (Self { inner, bytes_read: bytes_read.clone() }, bytes_read)
    }
}

impl<R: Read> Read for ProgressReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.bytes_read.fetch_add(n as u64, Ordering::Relaxed);
        Ok(n)
    }
}

fn colour_table_len(packed: u8) -> usize {
    3 * (1usize << (((packed & 0b0000_0111) as usize) + 1))
}

fn read_byte<R: Read>(reader: &mut R, context: &str) -> Result<u8, String> {
    let mut byte = [0u8; 1];
    reader
        .read_exact(&mut byte)
        .map_err(|e| format!("Failed to {context}: {e}"))?;
    Ok(byte[0])
}

fn skip_bytes<R: Read>(reader: &mut R, count: usize, context: &str) -> Result<(), String> {
    let skipped = std::io::copy(&mut reader.take(count as u64), &mut std::io::sink())
        .map_err(|e| format!("Failed to {context}: {e}"))?;
    if skipped != count as u64 {
        return Err(format!("Failed to {context}: unexpected end of file"));
    }
    Ok(())
}

fn skip_sub_blocks<R: Read>(reader: &mut R, context: &str) -> Result<(), String> {
    loop {
        let block_size = read_byte(reader, context)? as usize;
        if block_size == 0 {
            return Ok(());
        }
        skip_bytes(reader, block_size, context)?;
    }
}

fn count_gif_frames<R: Read>(mut reader: R) -> Result<usize, String> {
    let mut header = [0u8; 6];
    reader
        .read_exact(&mut header)
        .map_err(|e| format!("Failed to read GIF header: {e}"))?;
    if header != *b"GIF87a" && header != *b"GIF89a" {
        return Err("Failed to read GIF header: invalid GIF signature".to_string());
    }

    let mut logical_screen_descriptor = [0u8; 7];
    reader
        .read_exact(&mut logical_screen_descriptor)
        .map_err(|e| format!("Failed to read logical screen descriptor: {e}"))?;

    let packed = logical_screen_descriptor[4];
    if packed & 0b1000_0000 != 0 {
        skip_bytes(
            &mut reader,
            colour_table_len(packed),
            "skip global colour table",
        )?;
    }

    let mut frame_count = 0usize;
    loop {
        match read_byte(&mut reader, "read GIF block introducer")? {
            0x2C => {
                frame_count += 1;

                let mut image_descriptor = [0u8; 9];
                reader
                    .read_exact(&mut image_descriptor)
                    .map_err(|e| format!("Failed to read image descriptor: {e}"))?;

                let packed = image_descriptor[8];
                if packed & 0b1000_0000 != 0 {
                    skip_bytes(
                        &mut reader,
                        colour_table_len(packed),
                        "skip local colour table",
                    )?;
                }

                read_byte(&mut reader, "read LZW minimum code size")?;
                skip_sub_blocks(&mut reader, "skip image data sub-blocks")?;
            }
            0x21 => {
                read_byte(&mut reader, "read extension label")?;
                skip_sub_blocks(&mut reader, "skip extension sub-blocks")?;
            }
            0x3B => return Ok(frame_count),
            block_type => {
                return Err(format!(
                    "Failed to count GIF frames: invalid block introducer 0x{block_type:02X}"
                ));
            }
        }
    }
}

fn count_gif_frames_in_path(path: &Path) -> Result<usize, String> {
    let file = std::fs::File::open(path)
        .map_err(|e| format!("Failed to open '{}': {e}", path.display()))?;
    count_gif_frames(file)
}

/// Decode a GIF from any [`Read`] source, streaming events via `on_event`.
///
/// Emits `DecodeEvent::Progress` + `DecodeEvent::Frame` after each frame, then
/// `DecodeEvent::Complete` when all frames have been decoded.
pub fn decode_gif_streaming<R, F>(reader: R, total_bytes: u64, mut on_event: F) -> Result<(), String>
where
    R: Read,
    F: FnMut(DecodeEvent),
{
    let (progress_reader, bytes_counter) = ProgressReader::new(reader, total_bytes);

    let mut options = gif::DecodeOptions::new();
    options.set_color_output(gif::ColorOutput::RGBA);
    let mut decoder = options
        .read_info(progress_reader)
        .map_err(|e| format!("Failed to read GIF: {e}"))?;

    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let canvas_size = (width * height * 4) as usize;

    let mut canvas = vec![0u8; canvas_size];
    let mut previous_canvas = vec![0u8; canvas_size];
    let mut frame_count = 0usize;

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

        // Report byte-level progress after each frame — bytes_counter is updated by
        // ProgressReader as the decoder reads, so this reflects actual file consumption.
        let bytes_read = bytes_counter.load(Ordering::Relaxed);
        on_event(DecodeEvent::Progress { bytes_read, total_bytes });

        on_event(DecodeEvent::Frame(Frame {
            id: format!("frame-{frame_count}"),
            image_data,
            duration,
            width,
            height,
        }));
        frame_count += 1;

        match frame.dispose {
            gif::DisposalMethod::Background => clear_frame_area(&mut canvas, width, frame),
            gif::DisposalMethod::Previous => canvas.copy_from_slice(&previous_canvas),
            _ => {}
        }
    }

    on_event(DecodeEvent::Complete { frame_count });
    Ok(())
}

/// Open a GIF at `path`, read its size, and stream events via `on_event`.
///
/// This is the testable entry point used by the Tauri command.
pub fn decode_gif_stream_path<F>(path: &Path, on_event: F) -> Result<(), String>
where
    F: FnMut(DecodeEvent),
{
    let metadata = std::fs::metadata(path)
        .map_err(|e| format!("Failed to read '{}': {e}", path.display()))?;
    let total_bytes = metadata.len();
    let total_frames = count_gif_frames_in_path(path)?;
    let file = std::fs::File::open(path)
        .map_err(|e| format!("Failed to open '{}': {e}", path.display()))?;
    let mut on_event = on_event;
    on_event(DecodeEvent::Start {
        total_bytes,
        total_frames,
    });
    decode_gif_streaming(file, total_bytes, on_event)
}

fn encode_canvas_as_data_url(canvas: &[u8], width: u32, height: u32) -> Result<String, String> {
    let img = RgbaImage::from_raw(width, height, canvas.to_vec())
        .ok_or("Failed to create image from canvas")?;

    // image 0.25 defaults to CompressionType::Fast + FilterType::Adaptive, which is already
    // optimal for in-memory thumbnails: Adaptive-filtered data compresses much faster than raw.
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

    /// Decode all frames from in-memory GIF bytes using the streaming API.
    fn collect_frames(gif_data: &[u8]) -> Vec<Frame> {
        let total = gif_data.len() as u64;
        let mut frames = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, |event| {
            if let DecodeEvent::Frame(frame) = event {
                frames.push(frame);
            }
        })
        .unwrap();
        frames
    }

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

        let frames = collect_frames(&gif_data);
        assert_eq!(frames.len(), 2);
    }

    #[test]
    fn test_decode_frame_dimensions() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 8, 6, 5);

        let frames = collect_frames(&gif_data);
        assert_eq!(frames[0].width, 8);
        assert_eq!(frames[0].height, 6);
    }

    #[test]
    fn test_decode_frame_duration() {
        // delay=10 means 10 hundredths of a second = 100ms
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 10);

        let frames = collect_frames(&gif_data);
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

        let frames = collect_frames(&gif_data);
        assert_eq!(frames[0].id, "frame-0");
        assert_eq!(frames[1].id, "frame-1");
        assert_eq!(frames[2].id, "frame-2");
    }

    #[test]
    fn test_decode_produces_valid_data_urls() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 5);

        let frames = collect_frames(&gif_data);
        assert!(frames[0].image_data.starts_with("data:image/png;base64,"));
    }

    #[test]
    fn test_fast_png_encoding_produces_valid_data_url() {
        // 10x10 grey canvas
        let canvas = vec![128u8; 4 * 10 * 10];
        let data_url = encode_canvas_as_data_url(&canvas, 10, 10).unwrap();
        assert!(data_url.starts_with("data:image/png;base64,"));
        assert!(data_url.len() > "data:image/png;base64,".len());
    }

    #[test]
    fn test_fast_png_round_trip() {
        // 4x4 solid-red canvas
        let canvas: Vec<u8> = (0..16).flat_map(|_| [255u8, 0, 0, 255]).collect();
        let data_url = encode_canvas_as_data_url(&canvas, 4, 4).unwrap();
        let img = decode_data_url_to_rgba(&data_url).unwrap();
        assert_eq!(img.width(), 4);
        assert_eq!(img.height(), 4);
        let pixel = img.get_pixel(0, 0);
        assert_eq!(pixel[0], 255, "Red channel");
        assert_eq!(pixel[1], 0, "Green channel");
        assert_eq!(pixel[2], 0, "Blue channel");
        assert_eq!(pixel[3], 255, "Alpha channel");
    }

    // Timing tests are meaningless in unoptimised debug builds — run in release only.
    #[cfg(not(debug_assertions))]
    #[test]
    fn test_fast_compression_is_faster_than_best() {
        use image::codecs::png::{CompressionType, FilterType};
        use std::hint::black_box;
        use std::time::Instant;

        // Regression guard: PngEncoder::new() defaults to CompressionType::Fast.
        // Verify this stays faster than CompressionType::Best (high/slow compression)
        // so any accidental regression to slow settings is caught.
        let width: u32 = 640;
        let height: u32 = 480;
        let canvas = vec![128u8; (width * height * 4) as usize];

        let runs = 10;

        // Fast compression (current default via PngEncoder::new())
        let start = Instant::now();
        let mut fast_checksum: u64 = 0;
        for _ in 0..runs {
            let mut buf = Vec::new();
            PngEncoder::new(&mut buf)
                .write_image(&canvas, width, height, image::ExtendedColorType::Rgba8)
                .unwrap();
            fast_checksum =
                fast_checksum.wrapping_add(buf.iter().map(|&b| b as u64).sum::<u64>());
        }
        let fast_duration = start.elapsed();
        let _ = black_box(fast_checksum);

        // Best/high compression (slow — must not accidentally regress to this)
        let start = Instant::now();
        let mut best_checksum: u64 = 0;
        for _ in 0..runs {
            let mut buf = Vec::new();
            PngEncoder::new_with_quality(&mut buf, CompressionType::Best, FilterType::Adaptive)
                .write_image(&canvas, width, height, image::ExtendedColorType::Rgba8)
                .unwrap();
            best_checksum =
                best_checksum.wrapping_add(buf.iter().map(|&b| b as u64).sum::<u64>());
        }
        let best_duration = start.elapsed();
        let _ = black_box(best_checksum);

        assert!(
            fast_duration < best_duration,
            "Fast compression ({fast_duration:?}) was not faster than Best ({best_duration:?})"
        );
    }

    #[test]
    fn test_dedup_fixture_adjacent_duplicate_frames() {
        // The dedup.gif fixture must have:
        //   frame 0: red,  100 ms
        //   frame 1: red,  200 ms  ← adjacent duplicate → same imageData as frame 0
        //   frame 2: blue, 100 ms  ← different
        let fixture_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("tests/fixtures/dedup.gif");
        let gif_data = std::fs::read(&fixture_path)
            .unwrap_or_else(|e| panic!("failed to read {}: {e}", fixture_path.display()));
        let frames = collect_frames(&gif_data);
        assert_eq!(frames.len(), 3, "expected 3 frames");
        assert_eq!(frames[0].duration, 100, "frame 0 duration");
        assert_eq!(frames[1].duration, 200, "frame 1 duration");
        assert_eq!(frames[2].duration, 100, "frame 2 duration");
        assert_eq!(frames[0].image_data, frames[1].image_data, "frame 0 and 1 must be identical");
        assert_ne!(frames[0].image_data, frames[2].image_data, "frame 2 must differ");
    }

    #[test]
    fn test_data_url_round_trip() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 5);
        let frames = collect_frames(&gif_data);

        // Decode the data URL back to RGBA
        let rgba = decode_data_url_to_rgba(&frames[0].image_data).unwrap();
        assert_eq!(rgba.width(), 2);
        assert_eq!(rgba.height(), 2);

        // All pixels should be close to red (quantisation may shift values slightly)
        let pixel = rgba.get_pixel(0, 0);
        assert!(pixel[0] > 200, "Red channel should be high, got {}", pixel[0]);
        assert!(pixel[3] == 255, "Alpha should be 255");
    }

    // --- Phase 2: streaming tests ---

    #[test]
    fn test_progress_reader_tracks_bytes() {
        let data = vec![0u8; 1024];
        let (mut reader, counter) = ProgressReader::new(std::io::Cursor::new(data), 1024);

        let mut buf = vec![0u8; 512];
        reader.read(&mut buf).unwrap();
        assert_eq!(counter.load(Ordering::Relaxed), 512);

        reader.read(&mut buf).unwrap();
        assert_eq!(counter.load(Ordering::Relaxed), 1024);
    }

    #[test]
    fn test_decode_streaming_sends_all_frames() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
            4,
            4,
            10,
        );
        let total = gif_data.len() as u64;

        let mut frames = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, |event| {
            if let DecodeEvent::Frame(frame) = event {
                frames.push(frame);
            }
        })
        .unwrap();

        assert_eq!(frames.len(), 3);
        for frame in &frames {
            assert!(frame.image_data.starts_with("data:image/png;base64,"));
        }
    }

    #[test]
    fn test_decode_streaming_sends_progress_events() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255], [0, 255, 0, 255]], 8, 8, 10);
        let total = gif_data.len() as u64;

        let mut progress_events: Vec<(u64, u64)> = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, |event| {
            if let DecodeEvent::Progress { bytes_read, total_bytes } = event {
                progress_events.push((bytes_read, total_bytes));
            }
        })
        .unwrap();

        assert!(!progress_events.is_empty(), "should send at least one progress event");
        for &(bytes_read, total_bytes) in &progress_events {
            assert!(bytes_read <= total_bytes, "bytes_read should not exceed total_bytes");
            assert_eq!(total_bytes, total);
        }
        // bytes_read sequence should be non-decreasing
        for window in progress_events.windows(2) {
            assert!(window[0].0 <= window[1].0, "bytes_read should be non-decreasing");
        }
    }

    #[test]
    fn test_decode_streaming_completes_with_frame_count() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255], [0, 255, 0, 255]], 4, 4, 10);
        let total = gif_data.len() as u64;

        let mut complete_events: Vec<usize> = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, |event| {
            if let DecodeEvent::Complete { frame_count } = event {
                complete_events.push(frame_count);
            }
        })
        .unwrap();

        assert_eq!(complete_events.len(), 1, "should send exactly one Complete event");
        assert_eq!(complete_events[0], 2, "should report correct frame count");
    }

    #[test]
    fn test_decode_streaming_errors_on_invalid_path() {
        let mut events = Vec::new();
        let result = decode_gif_stream_path(
            std::path::Path::new("/nonexistent/path/file.gif"),
            |event| events.push(event),
        );
        assert!(result.is_err());
        assert!(events.is_empty(), "no events should be sent for an invalid path");
    }

    #[test]
    fn test_decode_streaming_starts_with_total_frame_count() {
        use std::io::Write;

        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
            4,
            4,
            10,
        );
        let mut file = tempfile::NamedTempFile::new().unwrap();
        file.write_all(&gif_data).unwrap();

        let mut first_event = None;
        decode_gif_stream_path(file.path(), |event| {
            if first_event.is_none() {
                first_event = Some(event);
            }
        })
        .unwrap();

        assert!(matches!(
            first_event,
            Some(DecodeEvent::Start {
                total_frames: 3,
                ..
            })
        ));
    }

    #[test]
    fn test_decode_streaming_sends_frames_from_blocking_task() {
        use std::io::Write;

        let gif_data = create_test_gif(&[[255, 0, 0, 255], [0, 255, 0, 255]], 4, 4, 10);
        let mut file = tempfile::NamedTempFile::new().unwrap();
        file.write_all(&gif_data).unwrap();
        let path = file.path().to_path_buf();

        let (start_frames, emitted_frames, completed_frames) = tauri::async_runtime::block_on(async {
            tauri::async_runtime::spawn_blocking(move || {
                let mut start_frames = None;
                let mut emitted_frames = 0usize;
                let mut completed_frames = None;

                decode_gif_stream_path(&path, |event| match event {
                    DecodeEvent::Start { total_frames, .. } => start_frames = Some(total_frames),
                    DecodeEvent::Frame(_) => emitted_frames += 1,
                    DecodeEvent::Complete { frame_count } => completed_frames = Some(frame_count),
                    DecodeEvent::Progress { .. } => {}
                })
                .unwrap();

                (start_frames, emitted_frames, completed_frames)
            })
            .await
            .unwrap()
        });

        assert_eq!(start_frames, Some(2));
        assert_eq!(emitted_frames, 2);
        assert_eq!(completed_frames, Some(2));
    }
}
