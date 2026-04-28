pub(super) fn composite_frame(
    canvas: &mut [u8],
    canvas_width: u32,
    canvas_height: u32,
    frame: &gif::Frame,
) -> Result<(), String> {
    let frame_left = frame.left as usize;
    let frame_top = frame.top as usize;
    let frame_width = frame.width as usize;
    let frame_height = frame.height as usize;
    let canvas_width = canvas_width as usize;
    let canvas_height = canvas_height as usize;

    if frame_left + frame_width > canvas_width || frame_top + frame_height > canvas_height {
        return Err(format!(
            "frame geometry ({frame_left},{frame_top})+({frame_width}x{frame_height}) exceeds canvas ({canvas_width}x{canvas_height})"
        ));
    }

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
    Ok(())
}

pub(super) fn clear_frame_area(
    canvas: &mut [u8],
    canvas_width: u32,
    canvas_height: u32,
    frame: &gif::Frame,
) -> Result<(), String> {
    let frame_left = frame.left as usize;
    let frame_top = frame.top as usize;
    let frame_width = frame.width as usize;
    let frame_height = frame.height as usize;
    let canvas_width = canvas_width as usize;
    let canvas_height = canvas_height as usize;

    if frame_left + frame_width > canvas_width || frame_top + frame_height > canvas_height {
        return Err(format!(
            "frame geometry ({frame_left},{frame_top})+({frame_width}x{frame_height}) exceeds canvas ({canvas_width}x{canvas_height})"
        ));
    }

    for y in 0..frame_height {
        for x in 0..frame_width {
            let idx = ((frame_top + y) * canvas_width + (frame_left + x)) * 4;
            canvas[idx..idx + 4].copy_from_slice(&[0, 0, 0, 0]);
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_composite_frame_rejects_x_overflow() {
        let canvas_width: u32 = 4;
        let canvas_height: u32 = 4;
        let mut canvas = vec![0u8; (canvas_width * canvas_height * 4) as usize];
        let frame = gif::Frame {
            left: 3,
            top: 0,
            width: 2,
            height: 2,
            buffer: std::borrow::Cow::Owned(vec![255u8; 2 * 2 * 4]),
            ..Default::default()
        };
        assert!(composite_frame(&mut canvas, canvas_width, canvas_height, &frame).is_err());
    }

    #[test]
    fn test_composite_frame_rejects_y_overflow() {
        let canvas_width: u32 = 4;
        let canvas_height: u32 = 4;
        let mut canvas = vec![0u8; (canvas_width * canvas_height * 4) as usize];
        let frame = gif::Frame {
            left: 0,
            top: 3,
            width: 2,
            height: 2,
            buffer: std::borrow::Cow::Owned(vec![255u8; 2 * 2 * 4]),
            ..Default::default()
        };
        assert!(composite_frame(&mut canvas, canvas_width, canvas_height, &frame).is_err());
    }

    #[test]
    fn test_composite_frame_within_bounds_succeeds() {
        let canvas_width: u32 = 4;
        let canvas_height: u32 = 4;
        let mut canvas = vec![0u8; (canvas_width * canvas_height * 4) as usize];
        let frame = gif::Frame {
            left: 1,
            top: 1,
            width: 2,
            height: 2,
            buffer: std::borrow::Cow::Owned(vec![255u8; 2 * 2 * 4]),
            ..Default::default()
        };
        assert!(composite_frame(&mut canvas, canvas_width, canvas_height, &frame).is_ok());
    }

    #[test]
    fn test_clear_frame_area_rejects_overflow() {
        let canvas_width: u32 = 4;
        let canvas_height: u32 = 4;
        let mut canvas = vec![0u8; (canvas_width * canvas_height * 4) as usize];
        let frame = gif::Frame {
            left: 3,
            top: 0,
            width: 2,
            height: 2,
            buffer: std::borrow::Cow::Owned(vec![255u8; 2 * 2 * 4]),
            ..Default::default()
        };
        assert!(clear_frame_area(&mut canvas, canvas_width, canvas_height, &frame).is_err());
    }
}
