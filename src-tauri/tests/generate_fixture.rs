/// One-shot helper: generates `tests/fixtures/test.gif` for E2E tests.
///
/// Run with: cargo test -p screeny --test generate_fixture -- --ignored --nocapture
use std::path::PathBuf;

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .to_path_buf()
}

fn make_export_frame(
    colour: [u8; 4],
    width: u32,
    height: u32,
    duration: u32,
) -> screeny_lib::gif::ExportFrame {
    use base64::{engine::general_purpose::STANDARD, Engine};

    let pixel_count = (width * height) as usize;
    let mut pixels = Vec::with_capacity(pixel_count * 4);
    for _ in 0..pixel_count {
        pixels.extend_from_slice(&colour);
    }

    screeny_lib::gif::ExportFrame {
        image_data: STANDARD.encode(&pixels),
        duration,
        width,
        height,
    }
}

#[test]
#[ignore]
fn generate_test_gif() {
    let frames = vec![
        make_export_frame([255, 0, 0, 255], 8, 8, 100),
        make_export_frame([0, 255, 0, 255], 8, 8, 100),
        make_export_frame([0, 0, 255, 255], 8, 8, 100),
    ];

    let output = project_root().join("tests/fixtures/test.gif");
    std::fs::create_dir_all(output.parent().unwrap()).unwrap();

    screeny_lib::gif::encode::encode_gif_file(&frames, &output).unwrap();
    println!("Wrote fixture to {}", output.display());

    // Verify it round-trips
    let not_cancelled = std::sync::atomic::AtomicBool::new(false);
    let mut frames_decoded = Vec::new();
    screeny_lib::gif::decode::decode_gif_stream_path(&output, &not_cancelled, |event| {
        if let screeny_lib::gif::DecodeEvent::Frame(frame) = event {
            frames_decoded.push(frame);
        }
    })
    .unwrap();
    assert_eq!(frames_decoded.len(), 3);
}
