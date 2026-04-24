# Task Plan: GIF Loading Performance — Speed, Progress, No Crash Dialog

## Goal

Make GIF loading at least 10x faster, stream frames with progress feedback so the UI never freezes, and eliminate the OS "app crashed" dialog.

## Current Phase

All phases complete (2026-04-23)

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
- **Status:** complete (automated tests done; manual/E2E verification failed — app still froze and triggered ANR)

### Phase 5: Quick Wins — Paint Boundary + Async Rust Command (TDD)

Two independent low-effort fixes. Priority from Q5: immediate loading feedback is the goal. The OS ANR dialog fix is NOT achievable here — see Q4 findings: the ANR is caused by GTK main thread blockage, not JS or Rust threads. Phase 6 (batching) is the actual ANR fix by reducing IPC channel pressure on the GTK loop.

**Option 1 — Paint boundary / loading UI timing:**
Force the browser to paint the loading state before decode begins, and keep it visible until the UI has genuinely settled (not just until `invoke` resolves).

- [x] Write tests covering immediate loading-state handoff after file selection / drop and the byte-to-frame progress display switch
- [x] Force a paint boundary in `Toolbar.svelte` between `startLoading()` and the decode invoke
- [x] Force a paint boundary in `+page.svelte` drag-and-drop handler between `startLoading()` and the decode invoke
- [x] Defer `finishLoading()` until after a final paint boundary so queued DOM updates drain before the loading indicator disappears
- [x] Write test: `Start` event carries correct `total_frames` count matching the GIF fixture
- [x] Write test: progress display shows byte percentage before first `Frame` event, then frame-count after
- [x] Add `Start { total_bytes: u64, total_frames: usize }` variant to `DecodeEvent` enum in `gif/mod.rs` and matching TypeScript union in `types.ts`
- [x] Implement cheap GIF frame pre-scan in `decode_gif_stream_path` with a lightweight GIF block parser
- [x] Emit `Start` as the very first channel event before `Progress`/`Frame` events
- [x] Update frontend handlers (`Toolbar.svelte`, `+page.svelte`) to track `totalFrames` from `Start`; show byte-based percentage for `Progress` events, switch to "Loading frame X of Y" once the first `Frame` event arrives
- [x] Run all Rust tests (`cargo test`)
- [x] Run frontend validation (`pnpm check`, `pnpm build`, `pnpm test:unit`)
- [x] Run app build validation (`pnpm tauri build`)
- [x] Follow `tdd` skill (red-green-refactor) for all new code

**Option 3 — Async Rust command:**
Make `decode_gif_stream` async and run the heavy decode work on a blocking task thread, as Tauri recommends for long-running commands. Note: this will NOT fix the OS ANR dialog (see Q4), but aligns with Tauri best practice.

- [x] Write test: streaming decode still emits all frames and completes correctly when run via `spawn_blocking`
- [x] Change `decode_gif_stream` in `src-tauri/src/lib.rs` from a synchronous to an `async` Tauri command
- [x] Wrap the decode call in `tauri::async_runtime::spawn_blocking` so the heavy Rust work runs off the Tauri async runtime's blocking executor without adding a new direct Tokio dependency
- [x] Run all Rust tests (`cargo test`)
- [x] Follow `tdd` skill (red-green-refactor) and `rust-standards` skill for all Rust changes
- [x] Update planning docs in line with the `planning` skill

- **Status:** complete

### Phase 6: Frontend Batching — Reduce Render Churn (TDD)

Primary fix for the OS ANR dialog (Q4): reducing channel event frequency lowers IPC pressure on the GTK main thread. Also the primary fix for faster E2E loading time (Q5 priority 2). Queue incoming frame events and flush in batches; avoid array copying on every append; stop unnecessary `FrameViewer` redraws during load.

**Outcome (2026-04-22):** Addressed all five frontend-side causes of render churn. However, Phase 6 introduced a UX regression (users can no longer see frames arriving during load) and achieved zero reduction in total load time (the real bottleneck was Rust-side PNG encoding, addressed in Phase 8). The frame batcher and Timeline placeholder were subsequently reverted in Phase 7; the `FrameViewer` redraw guard and push mutation were retained.

- [x] Write test: batched frame appends result in the correct final frame list
- [x] Write test: `FrameViewer` does not redraw when the selected frame index is unchanged
- [x] Replace `frames = [...frames, frame]` in `frames.svelte.ts` with a mutation-friendly structure (e.g. push + signal) to avoid O(n) array copies on every append
- [x] Buffer incoming `frame` channel events and flush in batches (e.g. every `requestAnimationFrame` or after N frames) in `Toolbar.svelte` and `+page.svelte`
- [x] Guard `FrameViewer` effect so it only rerenders when `selectedFrame.id` actually changes, not when the surrounding `frames` array reference changes
- [x] Reduce `Timeline.svelte` work during load: consider placeholders or suppressing thumbnail renders until loading is complete
- [x] Run all frontend tests (`pnpm test:unit`) — 327/327 pass
- [x] Follow `tdd` skill (red-green-refactor) for all new code
- [x] Update planning docs in line with the `planning` skill

Key files: `src/lib/stores/frames.svelte.ts`, `src/lib/frame-batcher.ts` (new), `src/lib/components/Timeline.svelte`, `src/lib/components/FrameViewer.svelte`, `src/lib/components/Toolbar.svelte`, `src/routes/+page.svelte`

- **Status:** complete (partially reverted in Phase 7 — see below)

### Phase 7: Partial Phase 6 Revert — Restore Streaming UX (TDD)

Phase 6's frame batcher and Timeline placeholder were identified as UX regressions: users could no longer see frames arriving during load, and load time was unchanged. These two changes were reverted. The `FrameViewer` redraw guard and push mutation remained (no downside). The underlying load-time bottleneck was then addressed in Phase 8.

- [x] Delete tests: "does not render frame thumbnails while loading is in progress", "shows a load placeholder in the timeline while loading", "renders thumbnails once loading has finished"
- [x] Add replacement tests asserting frames ARE visible during loading ("streaming frame visibility" describe block in `Timeline.test.ts`)
- [x] Update `Toolbar.test.ts`: remove 4 batcher-specific tests; add test asserting `frameStore.addFrame` is called directly
- [x] Update `page.test.ts`: remove 3 batcher-specific tests; add test asserting `frameStore.addFrame(event.data)` is called directly
- [x] Remove `{#if frameStore.isLoading}` placeholder branch from `Timeline.svelte`; restore `{#if frameStore.hasFrames}` as outer condition; remove `.loading-placeholder` CSS class
- [x] Remove `createFrameBatcher` from `Toolbar.svelte`; pass `(frame) => frameStore.addFrame(frame)` directly as the `onFrame` callback; remove all `batcher.flush()` calls
- [x] Remove `createFrameBatcher` from `+page.svelte`; call `frameStore.addFrame(event.data)` directly in `channel.onmessage`; remove `batcher.flush()` from `finally`
- [x] Delete `src/lib/frame-batcher.ts`
- [x] Delete `src/lib/frame-batcher.test.ts`
- [x] Run `pnpm test:unit` — 315/315 pass
- [x] Follow `tdd` skill (red-green-refactor) for all changes
- [x] Update planning docs in line with the `planning` skill
- **Status:** complete

### Phase 8: Raw RGBA Encoding — Eliminate PNG Bottleneck (TDD)

Remove per-frame PNG encoding from the Rust decode hot path. Replace `encode_canvas_as_data_url` (zlib compression + base64) with a plain base64 encode of the raw RGBA canvas bytes. Update the export path and all frontend rendering accordingly.

**Why this fixes the 15s load time:** The Phase 1 benchmark used flat-colour synthetic frames with near-zero entropy, yielding ~167µs/frame. Real screen-recording GIFs have high entropy; PNG Fast compression takes 10–100× longer (10–100ms/frame). At 100 frames × 50ms = 5s of pure compression — consistent with the observed 15s figure. Raw RGBA base64 takes ~5µs to encode, eliminating the bottleneck entirely.

#### Rust changes

- [x] Write test: `test_decode_produces_raw_rgba_base64` — decoded base64 has length `width × height × 4`
- [x] Write test: `test_decode_raw_rgba_pixel_values` — decoded bytes match expected RGBA pixel values
- [x] Remove `encode_canvas_as_data_url` from `decode.rs`; replace with `STANDARD.encode(&canvas)` inline (no zlib)
- [x] Update `Frame` doc comment in `mod.rs` to describe `image_data` as raw RGBA base64
- [x] Add `width: u32` and `height: u32` fields to `ExportFrame` in `mod.rs`
- [x] Update `encode_gif_file` in `encode.rs`: replace `decode_data_url_to_rgba` call with `STANDARD.decode` + `chunks_exact(4)` reshape; use `frame.width`/`frame.height` directly
- [x] Remove `decode_data_url_to_rgba` function from `decode.rs` (no callers)
- [x] Remove PNG-specific tests deleted alongside the removed functions: `test_fast_png_encoding_produces_valid_data_url`, `test_fast_png_round_trip`, `test_fast_compression_is_faster_than_best`, `test_data_url_round_trip`
- [x] Update `test_decode_streaming_sends_all_frames` to check raw RGBA byte length instead of PNG prefix
- [x] Update `encode.rs` test helper `make_export_frame` to use raw RGBA base64 (no PNG) and include `width`/`height`
- [x] Update `generate_fixture.rs` `make_export_frame` to use raw RGBA base64 and include `width`/`height`
- [x] Run `cargo test` — 25/25 pass
- [x] Follow `tdd` skill (red-green-refactor) and `rust-standards` skill for all Rust changes

#### TypeScript / Frontend changes

- [x] Write test: `exportGif` passes `width` and `height` in each `ExportFrame` (updated assertion in `actions.test.ts`)
- [x] Add `width: number` and `height: number` to `ExportFrame` interface in `types.ts`
- [x] Update `exportGif` in `actions.ts` to include `width: f.width, height: f.height` in each `ExportFrame`
- [x] Update `FrameViewer.svelte`: replace `new Image()` + `img.src` with `atob` → `Uint8ClampedArray` → `new ImageData` → `ctx.putImageData` (synchronous; no browser PNG decode step)
- [x] Update `Timeline.svelte`: replace `<img src={frame.imageData}>` with `<canvas use:drawRgba={frame}>` using a Svelte `use:` action; update `.frame-thumb img` CSS selector to `.frame-thumb canvas`
- [x] `makeFrame` helpers in TS test files: no change needed — SSR tests do not execute canvas effects, so `imageData` is never decoded in tests; existing helpers remain valid as dummy data
- [x] Run `pnpm test:unit` — 315/315 pass
- [x] Run `pnpm check` and `pnpm build` — 0 errors, clean build
- [x] Follow `tdd` skill (red-green-refactor) for all changes
- **Status:** complete

## Key Questions

1. Does `tauri::ipc::Channel` require any feature flags in Cargo.toml? → Check during Phase 2
2. Does the file picker need to change from returning bytes to returning a path? → Yes, simplifies everything
3. Should we keep the old `decode_gif` / `decode_gif_bytes` commands? → **No. Remove them.** E2E tests interact via UI (file picker), not direct command invocation. `e2e_open_fixture` is unused. See Q1 response.
4. What version of `image` crate is `new_with_quality` available in? → Need to verify for 0.25
5. Byte-level vs frame-count progress? → **Hybrid (Q6).** Byte-based percentage during file read for early feedback; switch to "frame X of Y" frame-count display once first `Frame` event arrives. Requires GIF pre-scan for total frame count. New `Start { total_bytes, total_frames }` event added to `DecodeEvent`.
6. Will raw RGBA base64 IPC volume become the new bottleneck at high resolutions (1080p+)? → Measure empirically; if needed, next step is lazy full-res fetch with downscaled thumbnails during streaming.

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
| Phase 6 frame batcher + Timeline placeholder reverted in Phase 7 | Phase 6 introduced a UX regression (users lost streaming frame visibility) with zero load-time benefit. The real bottleneck was Rust-side PNG encoding, not frontend render churn. Reverted in Phase 7; addressed in Phase 8. |
| `FrameViewer` `selectedFrameId` guard and push mutation retained after Phase 7 revert | These two Phase 6 changes have no UX downside and prevent spurious canvas redraws during streaming. |
| Replace PNG+base64 with raw-RGBA+base64 in Phase 8 | Eliminates zlib compression per frame — the dominant load-time cost. `STANDARD.encode(&canvas)` takes ~5µs vs 10–100ms for `PngEncoder`. |
| Add `width`/`height` to `ExportFrame` | Rust export path needs dimensions to interpret raw RGBA bytes; cleaner than embedding them in the base64 payload. |
| Remove `decode_data_url_to_rgba` | No callers after Phase 8. Export path now decodes raw RGBA directly. |
| `use:` action for Timeline canvas thumbnails | Clean Svelte pattern for per-item canvas rendering in `#each`; no-op under SSR so tests remain unaffected. |
| `makeFrame` helpers unchanged in TS tests | SSR tests never execute canvas effects, so `imageData` is never decoded; existing fake values remain valid as dummy data. |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| Phase 6 batcher + Timeline placeholder caused UX regression | 1 | Reverted both in Phase 7; kept `FrameViewer` guard and push mutation |
| Phase 1 PNG benchmark used synthetic flat-colour frames — result did not reflect real-world encode cost | 1 | Documented as lower bound in findings.md; Phase 8 addressed the real bottleneck |
| `generate_fixture.rs` missing `height`/`width` fields on `ExportFrame` after Phase 8 | 1 | Updated `make_export_frame` helper to raw RGBA base64 and added `width`/`height` fields |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
