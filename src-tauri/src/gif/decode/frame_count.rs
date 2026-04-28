use std::io::Read;
use std::path::Path;

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

pub(super) fn count_gif_frames<R: Read>(mut reader: R) -> Result<usize, String> {
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

pub(super) fn count_gif_frames_in_path(path: &Path) -> Result<usize, String> {
    let file = std::fs::File::open(path)
        .map_err(|e| format!("Failed to open '{}': {e}", path.display()))?;
    count_gif_frames(file)
}
