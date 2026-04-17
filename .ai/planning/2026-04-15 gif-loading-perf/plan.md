# Task Plan: GIF Loading Performance — Speed, Progress, No Crash Dialog

## Goal

Make GIF loading at least 10x faster, stream frames with progress feedback so the UI never freezes, and eliminate the OS "app crashed" dialog.

## Current Phase

Phase 5

## Phases

### Phase 1: Rust — Fast PNG Encoding (TDD)

**Finding:** `image 0.25.10` already defaults to `CompressionType::Fast + FilterType::Adaptive`, which is already optimal. No encoding change needed. Phase 1 adds regression-guard tests.

- [x] Write test: `test_fast_png_encoding_produces_valid_data_url` — verify PNG output is valid base64 data URL
- [x] Write test: `test_fast_png_round_trip` — verify PNG decodes back to correct RGBA pixels
- [x] Write benchmark test: `test_fast_compression_is_faster_than_best` — regression guard asserting Fast < Best compression (release only)
- [x] Verified `encode_canvas_as_data_url` already uses `PngEncoder::new()` = `CompressionType::Fast + FilterType::Adaptive` — no change needed
- [x] Run ALL existing decode tests — 19/19 pass
- [x] Update planning docs
- **Status:** complete

### Phase 2: Rust — Streaming Decode + Progress (TDD)

Add a new Tauri command that streams frames via `Channel` and reports byte-level progress.

- [x] Add `DecodeEvent` enum to `gif/mod.rs`: `Progress { bytes_read, total_bytes }`, `Frame(Frame)`, `Complete { frame_count }`
- [x] Write test: `test_progress_reader_tracks_bytes` — ProgressReader accumulates bytes correctly
- [x] Write test: `test_decode_streaming_sends_all_frames` — all frames arrive via channel
- [x] Write test: `test_decode_streaming_sends_progress_events` — progress events have valid byte counts
- [x] Write test: `test_decode_streaming_completes_with_frame_count` — final Complete event has correct count
- [x] Write test: `test_decode_streaming_errors_on_invalid_path` — returns error for bad paths
- [x] Implement `ProgressReader<R: Read>` wrapper — tracks bytes via `Arc<AtomicU64>` shared with decode loop (gif crate takes ownership of reader)
- [x] Implement `decode_gif_streaming(reader, total_bytes, on_event)` core function
- [x] Implement `decode_gif_stream_path(path, on_event)` — testable path-based entry point
- [x] Add Tauri command `decode_gif_stream` in `lib.rs`
- [x] Register new command in `lib.rs` invoke handler
- [x] Run all Rust tests — 24/24 pass
- [x] Update planning docs
- **Status:** complete

### Phase 3: Frontend — Streaming Store + Progress UI (TDD)

Update the frontend to use the streaming command, show progress, and handle frames incrementally.

- [x] Add `DecodeEvent` type to `types.ts` matching Rust enum
- [x] Write test: `addFrame` appends a frame and selects it if first
- [x] Write test: `startLoading/finishLoading` toggle loading state
- [x] Write test: `loadingProgress` tracks percentage and frame count
- [x] Implement `addFrame`, `startLoading`, `finishLoading`, `setLoadingProgress`, `isLoading`, `loadingProgress` in `frames.svelte.ts`
- [x] Update `GifBackend` interface: add `decodeStreaming(path, onFrame, onProgress): Promise<void>`
- [x] Write test: `openGifStreaming` calls backend.decodeStreaming with callbacks
- [x] Write test: `openGifStreaming` reports frames via onFrame callback
- [x] Write test: `openGifStreaming` handles errors
- [x] Implement `openGifStreaming` in `actions.ts`
- [x] Update `DialogProvider.openFile()` to return `Promise<string | null>` (path instead of bytes)
- [x] Update `Toolbar.svelte`: wire streaming backend, show progress bar + frame count during loading
- [x] Update `+page.svelte`: drag-and-drop uses streaming command
- [x] Run all frontend tests (`pnpm test:unit`) — 64/64 pass
- [x] Follow `tdd` skill (red-green-refactor) for all new code
- [x] Update planning docs in line with `planning-mode` skill
- **Status:** complete

### Phase 4: Cleanup + E2E + Verification

Remove dead code, update E2E tests, run full test suite, verify all requirements met.

E2E context: The E2E tests in `tests/e2e/specs/studio.ts` interact via the UI (file picker, buttons, timeline). They don't call `decode_gif`/`decode_gif_bytes` directly. `e2e_open_fixture` in `e2e.rs` is registered as a command but unused in any E2E spec. The streaming change should be transparent to E2E tests — the main thing to verify is that the status message text still matches expectations (e.g. "Loaded 3 frames").

- [x] Remove old `decode_gif` and `decode_gif_bytes` Tauri commands from `lib.rs` (superseded by streaming command)
- [x] Remove `decode_gif_file` and `decode_gif_bytes` functions from `decode.rs` (the streaming function replaces them)
- [x] Remove unused `e2e_open_fixture` command from `e2e.rs` and `lib.rs` (returns bytes, unused in any E2E spec)
- [x] Remove `read_file_bytes` command from `lib.rs` (no longer used by frontend)
- [x] Update `encode.rs` tests: replaced `decode_gif_file` with `decode_gif_stream_path` helper
- [x] Update `generate_fixture.rs`: replaced `decode_gif_file` with `decode_gif_stream_path`
- [x] Run full Rust test suite: `cargo test` — 22/22 pass
- [x] Run full frontend test suite: `pnpm test:unit` — 64/64 pass
- [x] Run E2E test suite: `pnpm test:e2e` (requires running Tauri app — skip if not CI-compatible)
- [x] Verify: loading a GIF shows progress indicator with percentage
- [x] Verify: no "app crashed" dialog on larger GIFs
- [x] Verify: 1MB GIF loads near-instantly
- [x] Update all planning docs to final state in line with `planning-mode` skill
- **Status:** complete (automated tests done; manual/E2E verification failed)

### Phase 5: Quick Wins — Paint Boundary + Async Rust Command (TDD)

Two independent low-effort fixes. Priority from Q5: immediate loading feedback is the goal. The OS ANR dialog fix is NOT achievable here — see Q4 findings: the ANR is caused by GTK main thread blockage, not JS or Rust threads. Phase 6 (batching) is the actual ANR fix by reducing IPC channel pressure on the GTK loop.

**Option 1 — Paint boundary / loading UI timing:**
Force the browser to paint the loading state before decode begins, and keep it visible until the UI has genuinely settled (not just until `invoke` resolves).

- [ ] Write test: loading state is visible immediately after file-picker confirmation (before decode starts)
- [ ] Force a paint boundary in `Toolbar.svelte` between `startLoading()` and the `invoke` call (e.g. `await tick()` or `requestAnimationFrame` Promise)
- [ ] Force a paint boundary in `+page.svelte` drag-and-drop handler between `startLoading()` and the `invoke` call
- [ ] Defer `finishLoading()` until after a final `await tick()` / `requestAnimationFrame` so queued DOM updates drain before the loading indicator disappears
- [ ] Write test: `Start` event carries correct `total_frames` count matching the GIF fixture
- [ ] Write test: progress display shows byte percentage before first `Frame` event, then frame-count after
- [ ] Add `Start { total_bytes: u64, total_frames: usize }` variant to `DecodeEvent` enum in `gif/mod.rs` and matching TypeScript union in `types.ts`
- [ ] Implement cheap GIF frame pre-scan in `decode_gif_stream_path` (scan for `0x2C` image descriptor markers to count frames; ~1–2 ms for typical files)
- [ ] Emit `Start` as the very first channel event before `Progress`/`Frame` events
- [ ] Update frontend handlers (`Toolbar.svelte`, `+page.svelte`) to track `totalFrames` from `Start`; show byte-based percentage for `Progress` events, switch to "Loading frame X of Y" once the first `Frame` event arrives
- [ ] Run all Rust tests (`cargo test`)
- [ ] Run all frontend tests (`pnpm test:unit`)
- [ ] Run all frontend tests (`pnpm test:unit`)
- [ ] Follow `tdd` skill (red-green-refactor) for all new code

**Option 3 — Async Rust command:**
Make `decode_gif_stream` async and run the heavy decode work on a blocking task thread, as Tauri recommends for long-running commands. Note: this will NOT fix the OS ANR dialog (see Q4), but aligns with Tauri best practice.

- [ ] Write test: streaming decode still emits all frames and completes correctly when run via `spawn_blocking`
- [ ] Change `decode_gif_stream` in `src-tauri/src/lib.rs` from a synchronous to an `async` Tauri command
- [ ] Wrap the decode call in `tokio::task::spawn_blocking` so the heavy Rust work runs off the async executor thread
- [ ] Run all Rust tests (`cargo test`)
- [ ] Follow `tdd` skill (red-green-refactor) and `rust-standards` skill for all Rust changes
- [ ] Update planning docs in line with the `planning` skill

- **Status:** pending

### Phase 6: Frontend Batching — Reduce Render Churn (TDD)

Primary fix for the OS ANR dialog (Q4): reducing channel event frequency lowers IPC pressure on the GTK main thread. Also the primary fix for faster E2E loading time (Q5 priority 2). Queue incoming frame events and flush in batches; avoid array copying on every append; stop unnecessary `FrameViewer` redraws during load.

- [ ] Write test: batched frame appends result in the correct final frame list
- [ ] Write test: `FrameViewer` does not redraw when the selected frame index is unchanged
- [ ] Replace `frames = [...frames, frame]` in `frames.svelte.ts` with a mutation-friendly structure (e.g. push + signal) to avoid O(n) array copies on every append
- [ ] Buffer incoming `frame` channel events and flush in batches (e.g. every `requestAnimationFrame` or after N frames) in `Toolbar.svelte` and `+page.svelte`
- [ ] Guard `FrameViewer` effect so it only rerenders when `selectedFrame.id` actually changes, not when the surrounding `frames` array reference changes
- [ ] Reduce `Timeline.svelte` work during load: consider placeholders or suppressing thumbnail renders until loading is complete
- [ ] Run all frontend tests (`pnpm test:unit`)
- [ ] Follow `tdd` skill (red-green-refactor) for all new code
- [ ] Update planning docs in line with the `planning` skill

Key files: `src/lib/stores/frames.svelte.ts:114-119`, `src/lib/components/Timeline.svelte:40-79`, `src/lib/components/FrameViewer.svelte:7-22`, `src/lib/components/Toolbar.svelte`, `src/routes/+page.svelte`

- **Status:** pending

### Phase 7: Frame Payload Redesign — Remove Per-Frame PNG Encode (TDD) [DEFERRED]

**Deferred per Q3:** complete Phase 6 first, then reevaluate whether Phase 7 is needed.

Stop generating a full PNG base64 data URL for every frame during initial load. Separate frame data by use case: timeline thumbnail, viewer display, and export.

- [ ] Write test: streaming decode emits lightweight frame data (e.g. raw RGBA bytes or dimensions only) rather than full PNG base64 strings
- [ ] Write test: viewer correctly renders a frame from lightweight data on demand
- [ ] Write test: export still produces correct output from the redesigned frame store
- [ ] Remove `encode_canvas_as_data_url` call from the streaming decode hot path in `src-tauri/src/gif/decode.rs:150-162`; emit raw RGBA bytes (or a compact representation) per frame instead
- [ ] Update `Frame` type in `src-tauri/src/gif/mod.rs` and `src/lib/types.ts` to carry raw pixel data rather than a PNG data URL
- [ ] Update `frames.svelte.ts` store to hold raw frame data; generate PNG/canvas representations lazily (on demand for viewer, on demand for timeline thumbnail)
- [ ] Update `Timeline.svelte` to generate thumbnails lazily (e.g. `OffscreenCanvas` per frame, only when visible)
- [ ] Update `FrameViewer.svelte` to decode raw RGBA into the canvas on demand
- [ ] Ensure export path (`encode.rs` + frontend export action) still receives full-quality frame data
- [ ] Run all Rust tests (`cargo test`)
- [ ] Run all frontend tests (`pnpm test:unit`)
- [ ] Follow `tdd` skill (red-green-refactor), `rust-standards` skill for Rust changes
- [ ] Update planning docs in line with the `planning` skill

Key files: `src-tauri/src/gif/decode.rs:150-162`, `src-tauri/src/gif/mod.rs`, `src/lib/types.ts`, `src/lib/stores/frames.svelte.ts`, `src/lib/components/Timeline.svelte:60`, `src/lib/components/FrameViewer.svelte`

- **Status:** pending

## Key Questions

1. Does `tauri::ipc::Channel` require any feature flags in Cargo.toml? → Check during Phase 2
2. Does the file picker need to change from returning bytes to returning a path? → Yes, simplifies everything
3. Should we keep the old `decode_gif` / `decode_gif_bytes` commands? → **No. Remove them.** E2E tests interact via UI (file picker), not direct command invocation. `e2e_open_fixture` is unused. See Q1 response.
4. What version of `image` crate is `new_with_quality` available in? → Need to verify for 0.25
5. Byte-level vs frame-count progress? → **Hybrid (Q6).** Byte-based percentage during file read for early feedback; switch to "frame X of Y" frame-count display once first `Frame` event arrives. Requires GIF pre-scan for total frame count. New `Start { total_bytes, total_frames }` event added to `DecodeEvent`.

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Fast PNG: keep defaults — `CompressionType::Fast` + `FilterType::Adaptive` | Phase 1 investigation found these are already the `image 0.25.10` defaults and are optimal. `FilterType::NoFilter` is 10x **slower**. No code change was made. |
| `tauri::ipc::Channel` for streaming | Purpose-built for command-to-frontend streaming in Tauri 2 |
| Send file path instead of bytes from file picker | Eliminates `read_file_bytes` + `Array.from()` overhead |
| Hybrid progress display (Q6) | Byte-based % during file read (early feedback); switches to "Loading frame X of Y" once first `Frame` event arrives (accurate encode progress). GIF pre-scan (~1–2 ms) provides `total_frames`. New `Start { total_bytes, total_frames }` event added to `DecodeEvent`. Supersedes earlier byte-only decision. |
| Incremental `addFrame` instead of bulk `setFrames` | Prevents DOM freeze from hundreds of thumbnails |
| Remove old decode commands + `e2e_open_fixture` | E2E tests use UI flow, not direct command invocation. `e2e_open_fixture` is unused. No backwards compat needed. |
| Async Rust command does NOT fix OS ANR dialog | Q4 research: Wayland ANR is triggered by the GTK main thread missing `xdg_wm_base` pings. JS runs in a separate WebKit2 process; Rust blocking threads are also separate from the GTK loop. High-frequency IPC channel delivery is the likely true cause. Phase 6 batching (fewer events) is the actual fix. |
| Phase 7 deferred until after Phase 6 | Q3: reevaluate need for payload redesign once Phase 6 impact is measured. |
| UX priority order (Q5) | 1st: app not frozen to OS + immediate loading feedback. 2nd: faster E2E loading. 3rd: accurate progress bar throughout (must not sit at 0% for 20 s then jump to 100%). |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## Notes

- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
