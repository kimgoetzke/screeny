# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: ~10 files across Rust backend and Svelte frontend will need modification, estimated 400+ lines of change. Requires streaming IPC, progress UI, fast PNG encoding, and full test coverage.

## Requirements

- Loading a GIF must not make the OS think the app has crashed (no "Terminate / Wait" dialog)
- Visual loading indicator during GIF decode
- Progress feedback strongly desired (percentage, frame count, or progress bar)
- 10x minimum speedup; 1MB GIF should load near-instantly
- Full test coverage (TDD: red-green-refactor)

## Research Findings

### Current Data Flow

**Drag-and-drop path** (`+page.svelte:44-52`):
```
handleDrop(path) → invoke("decode_gif", { path }) → Rust decodes ALL frames → returns Vec<Frame> as one JSON blob → frameStore.setFrames(frames)
```

**File picker path** (`Toolbar.svelte:42-53, 70-73`):
```
handleFilePickerConfirm(path) → invoke("read_file_bytes", { path }) → JS gets bytes
→ invoke("decode_gif_bytes", { data: Array.from(data) }) → Rust decodes → same blob return
```

The file picker path is doubly slow: `Array.from(data)` converts Uint8Array to a JSON number array (e.g. 1MB file = ~3MB JSON of numbers).

### Root Causes of Slowness

1. **PNG encoding per frame with default settings** (`decode.rs:164`): `PngEncoder::new()` uses zlib compression level 6 + adaptive row filtering (tries all 5 filters per row). For a 1080p frame this can take 100-500ms per frame. Hundreds of frames = tens of seconds.

2. **Single monolithic IPC response**: All frames must be decoded before ANY are returned. JSON serialization + deserialization of a multi-MB payload blocks the webview main thread.

3. **Bulk DOM update**: `frameStore.setFrames(frames)` with hundreds of frames triggers a massive Svelte reactive update rendering all thumbnails simultaneously, freezing the main thread.

4. **File picker byte round-trip**: `read_file_bytes` → `Array.from()` → `decode_gif_bytes` adds unnecessary IPC overhead when we already have the file path.

### Root Cause of "App Crashed" Dialog

The OS/Wayland compositor detects the webview is unresponsive. This happens because:
- Large JSON deserialization blocks the JS main thread
- Massive Svelte DOM update from hundreds of frames blocks the main thread
- While the `await invoke()` itself is async, the *completion handler* that processes the result runs synchronously on the main thread with the entire payload

### Key Code Locations

**Pre-Phase-1 (now removed):** `decode_gif_file`, `decode_gif_bytes`, `setFrames`, `e2e_open_fixture`, `read_file_bytes` — all deleted in Phase 4.

**Current (post-Phase-4):**

| File | Lines | What |
|------|-------|------|
| `src-tauri/src/gif/decode.rs` | 150-162 | `encode_canvas_as_data_url` — PNG+base64 per frame, still in hot path |
| `src-tauri/src/gif/decode.rs` | 77-148 | `decode_gif_stream_path` / `decode_gif_streaming` — streaming decode loop |
| `src-tauri/src/gif/mod.rs` | — | `Frame` struct, `DecodeEvent` enum |
| `src-tauri/src/lib.rs` | 17-22 | `decode_gif_stream` Tauri command (currently synchronous) |
| `src/lib/stores/frames.svelte.ts` | 114-119 | `addFrame` — copies full array on every append (`[...frames, frame]`) |
| `src/lib/stores/frames.svelte.ts` | 129-145 | `startLoading`, `finishLoading`, `setLoadingProgress` |
| `src/lib/actions.ts` | 22-50 | `openGifStreaming` + `GifBackend` interface |
| `src/lib/components/Toolbar.svelte` | 65-103 | Streaming open path, loading state management |
| `src/lib/components/Toolbar.svelte` | 189-205 | Progress bar rendering |
| `src/lib/components/Timeline.svelte` | 40-79 | Eager full-`#each` rerender on every frame append |
| `src/lib/components/Timeline.svelte` | 60 | Full PNG data URL used as `<img>` src for thumbnails |
| `src/lib/components/FrameViewer.svelte` | 7-22 | Selected-frame image decode/draw effect |
| `src/routes/+page.svelte` | 44-64 | Drag-and-drop streaming path |

### Performance Estimates

**Revised after Phase 1 investigation:**

`image 0.25.10` defaults to `CompressionType::Fast + FilterType::Adaptive`, not the assumed level-6 compression. Benchmarks (640x480, 10 runs, release mode):
- `Fast + Adaptive` (current default): ~167µs/frame
- `Fast + NoFilter`: ~1637µs/frame (**10x slower** — filtered data compresses much faster than raw)
- `Best + Adaptive` (slow path): measured as significantly slower than Fast

PNG encoding is NOT a bottleneck with current defaults. The 5-10x speedup from Phase 1 does not materialise. The meaningful performance gains are in Phases 2-3 (streaming + incremental DOM updates).

### Tauri 2 Channel API

`tauri::ipc::Channel<T>` allows streaming data from Rust commands to the frontend within a single invoke call:

```rust
#[tauri::command]
async fn decode_gif_streaming(path: String, on_event: Channel<DecodeEvent>) -> Result<(), String> {
    // on_event.send(DecodeEvent::Frame(frame))?;
}
```

Frontend:
```typescript
import { Channel } from "@tauri-apps/api/core";
const onEvent = new Channel<DecodeEvent>();
onEvent.onmessage = (event) => { /* handle */ };
await invoke("decode_gif_streaming", { path, onEvent });
```

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Keep PNG defaults — `CompressionType::Fast` + `FilterType::Adaptive` | Phase 1 found these are already the `image 0.25.10` defaults and are optimal. `FilterType::NoFilter` is 10x **slower** on typical image data. No change made. |
| Stream frames via `tauri::ipc::Channel` | Keeps UI responsive, enables progress, avoids huge JSON blobs |
| Both paths (drag-drop + file picker) send path string only | Eliminates `read_file_bytes` + `Array.from()` overhead; Rust reads file directly |
| Byte-tracking `ProgressReader` wrapper for percentage progress | Accurate progress without needing to count frames upfront (GIF has no frame count header). Overhead is effectively zero — see analysis above. |
| Incremental store updates (`addFrame`) instead of bulk `setFrames` | Prevents DOM freeze from rendering hundreds of thumbnails at once |
| Remove old `decode_gif`/`decode_gif_bytes` commands and `e2e_open_fixture` | E2E tests use UI (file picker), not direct command invocation. `e2e_open_fixture` is unused. No backwards compat needed. |

### E2E Test Analysis

**E2E specs** (`tests/e2e/specs/studio.ts`, `splashscreen.ts`) use WebDriver to interact with the real Tauri app UI:
- `studio.ts:76-100` "open GIF fixture": Opens file picker → navigates to fixture dir → selects `test.gif` → confirms → asserts "Loaded 3 frames" status message
- Tests call `e2e_fixture_dir` and `e2e_save_path` Tauri commands, but NOT `decode_gif`, `decode_gif_bytes`, or `e2e_open_fixture`
- `e2e_open_fixture` (`e2e.rs:58-69`) returns `Option<Vec<u8>>` — registered as Tauri command but **never called** from any E2E spec

**Impact of streaming change on E2E:**
- File picker UI flow unchanged (select file → confirm → frames load)
- Internal decode path changes from `read_file_bytes` + `decode_gif_bytes` to `decode_gif_stream(path)` — transparent to E2E
- Status message must still show "Loaded 3 frames" (or test assertion needs updating)
- `e2e_open_fixture` can be safely removed (unused)

### ProgressReader Overhead Analysis

The `ProgressReader<R: Read>` wrapper performs per `read()` call:
1. `self.bytes_read += n` (one addition)
2. `if bytes_read - last_reported > threshold` (one comparison)
3. Occasional `channel.send(Progress{...})` (when threshold crossed)

For context, a single GIF frame decode involves LZW decompression (~100us), canvas compositing (~10us), PNG encoding (~1-50ms), and base64 encoding (~100us). The ProgressReader overhead is immeasurable by comparison.

**Decision: byte-level progress with ProgressReader. Zero performance tradeoff.**

### Post-Implementation Validation Findings (2026-04-17)

Manual testing after Phases 1-4 showed the app still freezes, still triggers the OS "terminate or wait" prompt, and the progress bar only flashes briefly near the end. Root causes:

1. **Per-frame PNG+base64 encode still in the hot path** (`decode.rs:150-162`): Streaming moved the encode inside the loop, not off it. Each frame still composes a full canvas, PNG-encodes it, and base64-encodes it before being emitted. The benchmark used in Phase 1 tested synthetic flat-colour frames — real screen recordings have far more entropy and will be significantly slower.

2. **Frontend O(n) array copy on every frame** (`frames.svelte.ts:114-119`): `addFrame` does `frames = [...frames, frame]`, copying the entire array for every incoming frame event.

3. **Timeline rerenders the full `#each` block on every append** (`Timeline.svelte:40-79`): Each append triggers a full list rerender; every item uses the full PNG data URL as an `<img>` source (no thumbnails).

4. **`FrameViewer` rerenders on unrelated appends** (`FrameViewer.svelte:7-22`): The viewer effect depends on `selectedFrame`, which derives from `frames`, so appending any frame can trigger redundant canvas redraws.

5. **`decode_gif_stream` is a synchronous Tauri command** (`lib.rs:17-22`): Tauri recommends async + `spawn_blocking` for long-running commands. Running heavy work synchronously on the async executor can reduce app-level responsiveness.

6. **Byte-progress measures the wrong phase** (`decode.rs:112-113`): `bytes_read / total_bytes` tracks file I/O, not the expensive per-frame PNG/base64 work that follows. The progress bar therefore lags behind the actual heavy work and appears late. Loading is hidden as soon as `invoke` resolves, not after queued UI work drains.

### PNG Benchmark Caveat

The Phase 1 benchmark (`test_fast_compression_is_faster_than_best`, `decode.rs`) used 640×480 synthetic grey/red frames. These have almost no entropy. Real screen recordings are far more complex, so the ~167µs/frame figure is a lower bound and real-world per-frame encode time may be significantly higher.

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

- `src-tauri/src/gif/decode.rs` — main decode logic
- `src-tauri/src/lib.rs` — Tauri command registration
- `src/lib/actions.ts` — frontend decode orchestration
- `src/lib/stores/frames.svelte.ts` — frame state management
- Tauri 2 Channel docs: `tauri::ipc::Channel`
- `image` crate PNG encoder: `image::codecs::png::PngEncoder::new_with_quality`

_Update this file after every 2 view/browser/search operations_
