# Progress Log

## Session: 2026-04-15

### Phase 0: Research & Planning

- **Status:** complete
- **Started:** 2026-04-15
- Actions taken:
  - Explored entire codebase: Rust backend (decode.rs, lib.rs, mod.rs, encode.rs), frontend (stores, actions, components, page)
  - Identified 4 root causes: default PNG encoding, monolithic IPC, bulk DOM update, byte round-trip
  - Evaluated solutions: fast PNG, Tauri Channel streaming, ProgressReader, incremental store updates
  - Created plan with 4 phases, TDD approach throughout
- Files created/modified:
  - `.ai/planning/2026-04-15 gif-loading-perf/findings.md` (created)
  - `.ai/planning/2026-04-15 gif-loading-perf/plan.md` (created)
  - `.ai/planning/2026-04-15 gif-loading-perf/questions.md` (created)
  - `.ai/planning/2026-04-15 gif-loading-perf/progress.md` (created)

### Questions Processing Session

- **Status:** complete
- **Started:** 2026-04-16
- Actions taken:
  - Processed Q1 (E2E): Investigated `e2e.rs`, `studio.ts`, `splashscreen.ts`. E2E tests use UI flow, not direct commands. `e2e_open_fixture` is unused. Old decode commands can be removed.
  - Processed Q2 (Progress): Analysed ProgressReader overhead — effectively zero. Confirmed byte-level progress approach.
  - Updated plan.md: Phase 4 now has concrete E2E tasks, new decisions recorded, key questions answered
  - Updated findings.md: Added E2E analysis section and ProgressReader overhead analysis
- Files created/modified:
  - `questions.md` (marked responses as processed)
  - `plan.md` (updated Phase 4, Key Questions, Decisions)
  - `findings.md` (added E2E and ProgressReader analysis)
  - `progress.md` (this entry)

### Phase 1: Rust — Fast PNG Encoding (TDD)

- **Status:** complete
- Actions taken:
  - Discovered image 0.25.10 defaults to `CompressionType::Fast + FilterType::Adaptive` — no encoding change needed
  - Verified `FilterType::NoFilter` is ~10x SLOWER than `Adaptive` for typical image data (filtered data compresses faster)
  - Added 3 tests to `decode.rs`: `test_fast_png_encoding_produces_valid_data_url`, `test_fast_png_round_trip`, `test_fast_compression_is_faster_than_best` (release-only regression guard)
  - Updated `encode_canvas_as_data_url` comment to document why `PngEncoder::new()` defaults are already optimal
  - All 19 Rust tests pass
- Files created/modified:
  - `src-tauri/src/gif/decode.rs` — added 3 tests, updated comment on `encode_canvas_as_data_url`

### Phase 2: Rust — Streaming Decode + Progress (TDD)

- **Status:** complete
- Actions taken:
  - Added `DecodeEvent` enum to `gif/mod.rs` with adjacently-tagged serde for TypeScript consumption
  - Implemented `ProgressReader<R>` using `Arc<AtomicU64>` (gif crate takes ownership of reader, so shared atomic is the only way to observe bytes from outside)
  - Implemented `decode_gif_streaming` — emits Progress + Frame per frame, then Complete
  - Implemented `decode_gif_stream_path` — testable file-path entry point used by Tauri command
  - Added `decode_gif_stream` Tauri command to `lib.rs`, registered in invoke handler
  - All 5 streaming tests pass; 24/24 total Rust tests pass
- Files created/modified:
  - `src-tauri/src/gif/mod.rs` — added `DecodeEvent` enum
  - `src-tauri/src/gif/decode.rs` — added `ProgressReader`, `decode_gif_streaming`, `decode_gif_stream_path`, 5 tests
  - `src-tauri/src/lib.rs` — added `decode_gif_stream` command, registered it

### Phase 3: Frontend — Streaming Store + Progress UI (TDD)

- **Status:** complete
- Actions taken:
  - Added `DecodeEvent` union type to `types.ts` matching Rust's adjacently-tagged enum
  - Added `addFrame`, `startLoading`, `finishLoading`, `setLoadingProgress`, `isLoading`, `loadingProgress` to `frameStore`; `clear()` now resets loading state too
  - Replaced `openGif` with `openGifStreaming` in `actions.ts`; `DialogProvider.openFile()` now returns `Promise<string | null>` (path, not bytes); `GifBackend.decode` replaced by `decodeStreaming(path, onFrame, onProgress)`
  - Updated `Toolbar.svelte`: file picker confirm now resolves with path string directly; backend uses `Channel<DecodeEvent>` + `decode_gif_stream` invoke; `handleOpen` calls `openGifStreaming`; progress bar shown during `frameStore.isLoading`
  - Updated `+page.svelte`: drag-and-drop uses `Channel<DecodeEvent>` + `decode_gif_stream`, calling `frameStore.addFrame` and `frameStore.setLoadingProgress` incrementally
  - All 64 frontend tests pass
- Files created/modified:
  - `src/lib/types.ts` — added `DecodeEvent` type
  - `src/lib/stores/frames.svelte.ts` — added loading state + `addFrame`
  - `src/lib/stores/frames.test.ts` — added 11 new tests
  - `src/lib/actions.ts` — replaced `openGif` with `openGifStreaming`, updated interfaces
  - `src/lib/actions.test.ts` — replaced `openGif` tests with `openGifStreaming` tests
  - `src/lib/components/Toolbar.svelte` — streaming backend, progress bar UI
  - `src/routes/+page.svelte` — streaming drag-and-drop

### Phase 4: Cleanup + Verification

- **Status:** complete (automated tests; manual verification pending)
- Actions taken:
  - Removed `decode_gif_file` and `decode_gif_bytes` from `decode.rs`; existing tests converted to use `collect_frames` helper (internally calls `decode_gif_streaming`)
  - Removed `decode_gif`, `decode_gif_bytes`, `read_file_bytes` Tauri commands from `lib.rs`; removed their tests
  - Removed `e2e_open_fixture` from `e2e.rs` and invoke handler in `lib.rs`
  - Updated `encode.rs` tests: replaced `decode_gif_file` with `decode_all_frames` helper using `decode_gif_stream_path`
  - Updated `generate_fixture.rs`: replaced `decode_gif_file` with `decode_gif_stream_path`
  - Updated `lib.rs` import: removed unused `Frame`, kept `ExportFrame`
  - Rust: 22/22 tests pass (2 `read_file_bytes` tests removed along with the function)
  - Frontend: 64/64 tests pass
- Files created/modified:
  - `src-tauri/src/gif/decode.rs` — removed `decode_gif_file`, `decode_gif_bytes`; added `collect_frames` test helper
  - `src-tauri/src/gif/encode.rs` — replaced `decode_gif_file` with `decode_all_frames` helper
  - `src-tauri/src/lib.rs` — removed old commands, tests, updated import
  - `src-tauri/src/e2e.rs` — removed `e2e_open_fixture`
  - `src-tauri/tests/generate_fixture.rs` — replaced `decode_gif_file` with `decode_gif_stream_path`

## Error Log

| Timestamp | Error | Attempt | Resolution |
| --------- | ----- | ------- | ---------- |
|           |       | 1       |            |

### Questions Processing Session (2026-04-17)

- **Status:** complete
- Actions taken:
  - Processed Q3 (Phase 7 deferral): Phase 7 explicitly deferred until after Phase 6; plan.md updated
  - Processed Q4 (Wayland ANR mechanism): researched xdg_wm_base ping/pong, WebKit2 multi-process model, GTK main thread; finding: async Rust and JS churn do NOT cause the ANR — GTK main thread blockage from high-frequency IPC channel delivery is the likely true cause; Phase 5/6 notes updated; findings.md updated with full research
  - Processed Q5 (UX priorities): priorities recorded; progress bar accuracy concern raised as Q6; Phase 5 updated to flag progress bar approach as pending Q6 answer
  - Added Q6 (progress bar accuracy — byte-based vs frame-count vs spinner)
- Files created/modified:
  - `questions.md` (Q3, Q4, Q5 marked processed; Q6 added)
  - `plan.md` (Phase 5/6/7 notes updated; decisions table extended)
  - `findings.md` (Wayland ANR research section added)
  - `progress.md` (this entry)

### Questions Processing Session (2026-04-17, Q6)

- **Status:** complete
- Actions taken:
  - Processed Q6 (progress bar approach): hybrid adopted — byte % during file read, "frame X of Y" once streaming begins; requires GIF pre-scan for total frame count; new `Start { total_bytes, total_frames }` `DecodeEvent` variant
  - plan.md updated: Phase 5 tasks expanded with concrete hybrid implementation steps; Key Question #5 and decisions table updated (supersedes byte-only decision)
  - questions.md: Q6 marked processed
- Files created/modified:
  - `questions.md` (Q6 marked processed)
  - `plan.md` (Phase 5 tasks, KQ5, decisions table)
  - `progress.md` (this entry)

### Phase 5: Quick Wins — Paint Boundary + Async Rust Command

- **Status:** complete
- Actions taken:
  - Added `DecodeEvent::Start { total_bytes, total_frames }` and a lightweight GIF block pre-scan so the frontend knows total frame count before the first decoded frame arrives
  - Added `waitForNextPaint()` and used it before decode starts and before `finishLoading()` in both the toolbar open flow and drag-and-drop flow
  - Extended `frameStore` loading state with `loadingFrameCount` / `loadingTotalFrames` and updated the toolbar progress label to switch from byte percentage to `Loading frame X of Y`
  - Made `decode_gif_stream` an async Tauri command and moved the decode work to `tauri::async_runtime::spawn_blocking`
  - Added Rust tests for the new `Start` event and blocking-task decode path, plus frontend tests for the new progress display and paint-boundary usage
  - Validation passed: `pnpm check`, `pnpm build`, `pnpm test:unit`, `cargo test`, `pnpm tauri build`
- Files created/modified:
  - `src-tauri/src/gif/mod.rs` — added `Start` decode event
  - `src-tauri/src/gif/decode.rs` — added GIF frame pre-scan and new Phase 5 tests
  - `src-tauri/src/lib.rs` — made `decode_gif_stream` async via `tauri::async_runtime::spawn_blocking`
  - `src/lib/types.ts` — added `DecodeStart`
  - `src/lib/actions.ts` / `actions.test.ts` — added `beforeDecode` / `onStart` orchestration for streaming opens
  - `src/lib/stores/frames.svelte.ts` / `frames.test.ts` — added frame-total loading state
  - `src/lib/components/Toolbar.svelte` / `Toolbar.test.ts` — added hybrid progress UI and paint-boundary handling
  - `src/routes/+page.svelte` / `page.test.ts` — updated drag/drop loading flow
  - `src/lib/paint.ts` — new shared paint-boundary helper

### Phase 6: Frontend Batching — Reduce Render Churn (2026-04-22)

- **Status:** complete
- Actions taken (TDD red-green-refactor throughout):
  - `frames.svelte.ts`: swapped `frames = [...frames, frame]` for in-place `frames.push(frame)` mutation (Svelte 5 `$state` proxy reacts to mutation methods); added `addFrames(newFrames: Frame[])` bulk helper
  - `frames.test.ts`: added reference-preservation test on `addFrame` plus 6 new tests covering `addFrames`
  - New module `src/lib/frame-batcher.ts`: `createFrameBatcher(onFlush)` buffers incoming frames and flushes once per `requestAnimationFrame`; exposes explicit `flush()` for timing-sensitive moments; 6 tests
  - `Toolbar.svelte`: open flow feeds each streamed frame through the batcher; explicit `flush()` before `onFirstFrame` and in `finally`
  - `+page.svelte`: drag-and-drop flow mirrors the same batcher usage
  - `FrameViewer.svelte`: effect now tracks only `frameStore.selectedFrameId` and reads frame via `untrack`
  - `Timeline.svelte`: added top-level branch rendering "Decoding frames…" placeholder while `frameStore.isLoading` is true; thumbnails materialise once after `finishLoading`
  - Validation: `npx vitest run` — 327/327 tests pass; `npx svelte-check` — 0 errors; `npx vite build` — clean
- Files created/modified:
  - `src/lib/stores/frames.svelte.ts` (push mutation, `addFrames`)
  - `src/lib/stores/frames.test.ts` (new tests)
  - `src/lib/frame-batcher.ts` (new)
  - `src/lib/frame-batcher.test.ts` (new)
  - `src/lib/components/Toolbar.svelte` + `Toolbar.test.ts`
  - `src/routes/+page.svelte` + `src/routes/page.test.ts`
  - `src/lib/components/FrameViewer.svelte` + `FrameViewer.test.ts`
  - `src/lib/components/Timeline.svelte` + `Timeline.test.ts`

## Session: 2026-04-23

### Phase 7: Partial Phase 6 Revert — Restore Streaming UX

- **Status:** complete
- Context: Phase 6 achieved zero load-time reduction and introduced a UX regression — users could no longer see frames streaming in during load. The batching approach and Timeline placeholder were identified as the cause.
- Actions taken:
  - Removed `createFrameBatcher` import and usage from `Toolbar.svelte` — now calls `frameStore.addFrame(frame)` directly
  - Removed `createFrameBatcher` import and usage from `+page.svelte` — now calls `frameStore.addFrame(event.data)` directly
  - Removed `{#if frameStore.isLoading}` placeholder branch from `Timeline.svelte`; outer condition restored to `{#if frameStore.hasFrames}`
  - Removed `.loading-placeholder` CSS rule from `Timeline.svelte`
  - Deleted `src/lib/frame-batcher.ts` and `src/lib/frame-batcher.test.ts`
  - Updated `Timeline.test.ts`: replaced "suppresses thumbnails during load" describe block with "streaming frame visibility" block (2 new tests asserting frames are visible during load)
  - Updated `Toolbar.test.ts`: removed 4 batcher-specific tests, added 1 test asserting `frameStore.addFrame` is called directly
  - Updated `page.test.ts`: removed 3 batcher-specific tests, added 1 test asserting `frameStore.addFrame(event.data)` is called directly
  - 315/315 frontend tests pass
- Files created/modified:
  - `src/lib/components/Timeline.svelte` + `Timeline.test.ts`
  - `src/lib/components/Toolbar.svelte` + `Toolbar.test.ts`
  - `src/routes/+page.svelte` + `src/routes/page.test.ts`
  - `src/lib/frame-batcher.ts` (deleted)
  - `src/lib/frame-batcher.test.ts` (deleted)

### Phase 8: Raw RGBA Encoding — Eliminate Per-Frame PNG Compression

- **Status:** complete
- Context: `encode_canvas_as_data_url` (`decode.rs:204`) was running per frame inside the decode loop, applying zlib compression (PNG encoding). At 50–100ms/frame for real screen-recording content, this was the dominant load-time cost (~80–100%).
- Actions taken (TDD):
  - Updated `actions.test.ts`: renamed export test to assert `width`/`height` are included in `ExportFrame`
  - Updated `types.ts`: added `width: number` and `height: number` to `ExportFrame` interface
  - Updated `actions.ts`: `exportGif` now includes `width: f.width, height: f.height` in each export frame
  - Updated `mod.rs` (`ExportFrame`): added `width: u32` and `height: u32` fields; updated doc comment for `Frame.image_data`
  - Updated `decode.rs`: removed `image` crate imports; removed `encode_canvas_as_data_url` and `decode_data_url_to_rgba`; replaced hot-path call with `STANDARD.encode(&canvas)` (raw RGBA base64, no zlib); removed PNG-format tests; added `test_decode_produces_raw_rgba_base64` and `test_decode_raw_rgba_pixel_values`; updated `test_decode_streaming_sends_all_frames` to check raw RGBA byte length
  - Updated `encode.rs`: removed `decode_data_url_to_rgba` import; added `STANDARD.decode` + `chunks_exact(4)` raw RGBA decode; updated `make_export_frame` to use `STANDARD.encode(&pixels)` (raw RGBA base64)
  - Updated `generate_fixture.rs`: updated `make_export_frame` to use raw RGBA base64 and include `width`/`height`
  - Updated `FrameViewer.svelte`: replaced `new Image()` / `img.src` with `atob` → `Uint8ClampedArray` → `new ImageData` → `ctx.putImageData` (synchronous, no browser PNG decode)
  - Updated `Timeline.svelte`: replaced `<img src={frame.imageData}>` with `<canvas use:drawRgba={frame}>` using a Svelte `use:` action; updated `.frame-thumb img` CSS to `.frame-thumb canvas`
  - 25/25 Rust tests pass; 315/315 frontend tests pass; `svelte-check` 0 errors; `pnpm build` clean
- Files created/modified:
  - `src-tauri/src/gif/decode.rs`
  - `src-tauri/src/gif/mod.rs`
  - `src-tauri/src/gif/encode.rs`
  - `src-tauri/tests/generate_fixture.rs`
  - `src/lib/types.ts`
  - `src/lib/actions.ts`
  - `src/lib/actions.test.ts`
  - `src/lib/components/FrameViewer.svelte`
  - `src/lib/components/Timeline.svelte`

## Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
|      |       |          |        |        |

## 5-Question Reboot Check

| Question             | Answer |
| -------------------- | ------ |
| Where am I?          | Phases 1–8 complete |
| Where am I going?    | Q7 (IPC volume at 1080p) open for empirical measurement; no immediate action required |
| What's the goal?     | 10x faster GIF loading with streaming progress, no crash dialog |
| What have I learned? | PNG encoding per frame was the dominant bottleneck; raw RGBA base64 eliminates it. `generate_fixture.rs` also needed updating. SSR tests are unaffected by `imageData` format changes. Phase 6 batching was purely frontend-side and could not reduce Rust CPU time. |
| What have I done?    | Phases 1–8 complete: streaming IPC, progress UI, frontend optimisations, Phase 6 UX revert, raw RGBA encoding replacing per-frame PNG compression. |

---

_Update after completing each phase or encountering errors_
