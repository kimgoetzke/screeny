use std::io::Read;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};

use base64::{Engine, engine::general_purpose::STANDARD};

use super::{DecodeEvent, Frame};

mod composite;
mod frame_count;
mod progress;

use composite::{clear_frame_area, composite_frame};
use frame_count::count_gif_frames_in_path;
use progress::ProgressReader;

/// Decode a GIF from any [`Read`] source, streaming events via `on_event`.
///
/// Emits `DecodeEvent::Progress` + `DecodeEvent::Frame` after each frame, then
/// `DecodeEvent::Complete` when all frames have been decoded.
pub fn decode_gif_streaming<R, F>(reader: R, total_bytes: u64, cancelled: &AtomicBool, mut on_event: F) -> Result<(), String>
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
        if cancelled.load(Ordering::Relaxed) {
            return Ok(());
        }

        if frame.dispose == gif::DisposalMethod::Previous {
            previous_canvas.copy_from_slice(&canvas);
        }

        composite_frame(&mut canvas, width, height, frame)
            .map_err(|e| format!("frame {frame_count}: {e}"))?;
        // Encode the composited canvas as raw RGBA base64 — no PNG compression overhead.
        let image_data = STANDARD.encode(&canvas);
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
            gif::DisposalMethod::Background => {
                clear_frame_area(&mut canvas, width, height, frame)
                    .map_err(|e| format!("frame {frame_count}: {e}"))?;
            }
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
pub fn decode_gif_stream_path<F>(path: &Path, cancelled: &AtomicBool, on_event: F) -> Result<(), String>
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
    decode_gif_streaming(file, total_bytes, cancelled, on_event)
}


#[cfg(test)]
mod tests {
    use super::*;

    /// Decode all frames from in-memory GIF bytes using the streaming API.
    fn collect_frames(gif_data: &[u8]) -> Vec<Frame> {
        let total = gif_data.len() as u64;
        let cancelled = AtomicBool::new(false);
        let mut frames = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, &cancelled, |event| {
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
    fn test_decode_produces_raw_rgba_base64() {
        let width: u16 = 2;
        let height: u16 = 2;
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], width, height, 5);

        let frames = collect_frames(&gif_data);

        // imageData must be plain base64 (no data URL prefix)
        assert!(!frames[0].image_data.starts_with("data:"));

        // Decoded bytes must be exactly width × height × 4 RGBA bytes
        let raw = STANDARD.decode(&frames[0].image_data).unwrap();
        assert_eq!(raw.len(), (width as usize) * (height as usize) * 4);
    }

    #[test]
    fn test_decode_raw_rgba_pixel_values() {
        // 2×2 solid red frame
        let gif_data = create_test_gif(&[[255, 0, 0, 255]], 2, 2, 5);
        let frames = collect_frames(&gif_data);

        let raw = STANDARD.decode(&frames[0].image_data).unwrap();

        // All pixels should be red (R=255, G=0, B=0, A=255)
        for chunk in raw.chunks_exact(4) {
            assert_eq!(chunk[0], 255, "R channel");
            assert_eq!(chunk[1], 0,   "G channel");
            assert_eq!(chunk[2], 0,   "B channel");
            assert_eq!(chunk[3], 255, "A channel");
        }
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

    // --- Phase 2: streaming tests ---

    #[test]
    fn test_decode_streaming_sends_all_frames() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
            4,
            4,
            10,
        );
        let total = gif_data.len() as u64;

        let not_cancelled = AtomicBool::new(false);
        let mut frames = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, &not_cancelled, |event| {
            if let DecodeEvent::Frame(frame) = event {
                frames.push(frame);
            }
        })
        .unwrap();

        assert_eq!(frames.len(), 3);
        // Each imageData must be decodable base64 of the correct byte length (4 × 4 × 4 RGBA)
        for frame in &frames {
            let raw = STANDARD.decode(&frame.image_data).unwrap();
            assert_eq!(raw.len(), 4 * 4 * 4);
        }
    }

    #[test]
    fn test_decode_streaming_sends_progress_events() {
        let gif_data = create_test_gif(&[[255, 0, 0, 255], [0, 255, 0, 255]], 8, 8, 10);
        let total = gif_data.len() as u64;
        let not_cancelled = AtomicBool::new(false);

        let mut progress_events: Vec<(u64, u64)> = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, &not_cancelled, |event| {
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
        let not_cancelled = AtomicBool::new(false);

        let mut complete_events: Vec<usize> = Vec::new();
        decode_gif_streaming(std::io::Cursor::new(gif_data), total, &not_cancelled, |event| {
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
        let not_cancelled = AtomicBool::new(false);
        let mut events = Vec::new();
        let result = decode_gif_stream_path(
            std::path::Path::new("/nonexistent/path/file.gif"),
            &not_cancelled,
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
        let not_cancelled = AtomicBool::new(false);

        let mut first_event = None;
        decode_gif_stream_path(file.path(), &not_cancelled, |event| {
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
                let not_cancelled = AtomicBool::new(false);
                let mut start_frames = None;
                let mut emitted_frames = 0usize;
                let mut completed_frames = None;

                decode_gif_stream_path(&path, &not_cancelled, |event| match event {
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

    #[test]
    fn test_cancellation_before_decode_emits_no_frames() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
            4,
            4,
            10,
        );
        let total = gif_data.len() as u64;
        let cancelled = AtomicBool::new(true);

        let mut frames = Vec::new();
        let result = decode_gif_streaming(std::io::Cursor::new(gif_data), total, &cancelled, |event| {
            if let DecodeEvent::Frame(frame) = event {
                frames.push(frame);
            }
        });

        assert!(result.is_ok(), "cancellation must not produce an error");
        assert!(frames.is_empty(), "no frames should be emitted when already cancelled");
    }

    #[test]
    fn test_cancellation_mid_decode_stops_emission() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]],
            4,
            4,
            10,
        );
        let total = gif_data.len() as u64;
        let cancelled = AtomicBool::new(false);

        let mut frame_count = 0usize;
        let result = decode_gif_streaming(std::io::Cursor::new(gif_data), total, &cancelled, |event| {
            if let DecodeEvent::Frame(_) = event {
                frame_count += 1;
                // Cancel after first frame
                cancelled.store(true, Ordering::Relaxed);
            }
        });

        assert!(result.is_ok(), "mid-decode cancellation must not produce an error");
        assert_eq!(frame_count, 1, "only the first frame should have been emitted");
    }

    #[test]
    fn test_non_cancelled_decode_is_unaffected() {
        let gif_data = create_test_gif(
            &[[255, 0, 0, 255], [0, 255, 0, 255]],
            4,
            4,
            10,
        );
        let total = gif_data.len() as u64;
        let cancelled = AtomicBool::new(false);

        let mut frames = Vec::new();
        let result = decode_gif_streaming(std::io::Cursor::new(gif_data), total, &cancelled, |event| {
            if let DecodeEvent::Frame(frame) = event {
                frames.push(frame);
            }
        });

        assert!(result.is_ok());
        assert_eq!(frames.len(), 2, "all frames should be emitted when not cancelled");
    }
}
