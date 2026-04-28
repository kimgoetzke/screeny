use std::io::Read;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

/// Wraps a [`Read`] implementor and tracks total bytes consumed via a shared atomic counter.
///
/// The decoder takes ownership of the reader, so the counter provides the only way to observe
/// progress from outside the decoder during streaming.
pub(super) struct ProgressReader<R: Read> {
    inner: R,
    bytes_read: Arc<AtomicU64>,
}

impl<R: Read> ProgressReader<R> {
    /// Creates a new `ProgressReader` and returns a shared counter alongside it.
    /// The counter is updated on every `read()` call.
    pub(super) fn new(inner: R, _total_bytes: u64) -> (Self, Arc<AtomicU64>) {
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

#[cfg(test)]
mod tests {
    use super::*;

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
}
