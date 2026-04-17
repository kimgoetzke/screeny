---
date: 2026-04-17T05:13:40+01:00
git_commit: 7f80071f022f00adc4c5f403a90710f68cdaa1c8
branch: main
repository: screeny
topic: "GIF loading still freezes after the 2026-04-15 perf work"
status: complete
last_updated: 2026-04-17
last_updated_by: GitHub Copilot
---

# Research: GIF loading still freezes after the 2026-04-15 perf work

**Date**: 2026-04-17T05:13:40+01:00  
**Git Commit**: `7f80071f022f00adc4c5f403a90710f68cdaa1c8`  
**Branch**: `main`  
**Repository**: `screeny`

## Research Question

Why does the app still appear frozen for seconds, still trigger the system "terminate or wait" prompt, and only show the new progress bar for a very short flash near the end after the 2026-04-15 GIF-loading perf work?

## Summary

The 2026-04-15 change did remove two parts of the old path: the file-picker byte round-trip and the single huge `Vec<Frame>` return at the very end. The open path is now path-based and streamed (`src/lib/components/Toolbar.svelte:65-103`, `src/routes/+page.svelte:44-64`, `src-tauri/src/lib.rs:17-22`).

But the core work is still heavy on both sides of the IPC boundary. Rust still composites every frame and turns the full canvas into a PNG base64 data URL before emitting the frame (`src-tauri/src/gif/decode.rs:106-121`, `150-162`). The frontend then handles every streamed message synchronously, appends every frame with an array copy (`src/lib/stores/frames.svelte.ts:114-119`), mounts every frame immediately as a full `<img>` in the timeline (`src/lib/components/Timeline.svelte:40-79`), and likely reruns the viewer effect on every append (`src/lib/components/FrameViewer.svelte:7-22`).

That means the freeze moved, but did not disappear. Instead of one giant end-of-load stall, the app can still spend most of the load in backend encode/serialise work plus frontend message/render churn. Byte-based progress also does not describe that expensive work, so it naturally appears late and briefly (`src-tauri/src/gif/decode.rs:112-113`; `src/lib/components/Toolbar.svelte:99-102`, `189-205`).

## Detailed Findings

### Before the perf change

The pre-change path was:

- Drag/drop: `handleDrop(path) -> invoke("decode_gif", { path }) -> Rust decodes all frames -> returns full frame array -> frameStore.setFrames(frames)` (`.ai/planning/2026-04-15 gif-loading-perf/findings.md:20-23`)
- File picker: `read_file_bytes -> Array.from(data) -> decode_gif_bytes` (`.ai/planning/2026-04-15 gif-loading-perf/findings.md:25-31`)

The original findings correctly called out the monolithic IPC response, the byte round-trip, and the bulk `setFrames` update as freeze sources (`.ai/planning/2026-04-15 gif-loading-perf/findings.md:37-48`).

### What changed in the current implementation

The new implementation changed four visible parts:

1. The file picker now returns only a path string, not bytes (`src/lib/actions.ts:22-39`, `src/lib/components/Toolbar.svelte:25-31`, `43-48`).
2. Both open paths now call `decode_gif_stream` instead of old decode commands (`src/lib/components/Toolbar.svelte:65-79`, `src/routes/+page.svelte:48-59`, `src-tauri/src/lib.rs:17-22`).
3. Rust now emits `progress`, `frame`, and `complete` events (`src-tauri/src/gif/mod.rs:10-16`, `src-tauri/src/gif/decode.rs:110-131`).
4. The frontend now appends frames incrementally via `addFrame()` instead of calling `setFrames()` once (`src/lib/stores/frames.svelte.ts:114-145`).

### Why the current UX still matches the user's report

#### 1. The progress bar is eligible early, but paint can still be starved

The loading bar becomes eligible as soon as `frameStore.startLoading()` runs (`src/lib/components/Toolbar.svelte:83-87`, `src/lib/stores/frames.svelte.ts:129-135`). The progress UI itself is the `frameStore.isLoading` branch (`src/lib/components/Toolbar.svelte:189-205`).

However, once decode starts, every streamed message is handled immediately on the frontend (`src/lib/components/Toolbar.svelte:66-79`, `src/routes/+page.svelte:48-59`). Each `frame` event triggers a store append and reactive rerender. That gives the browser very little idle time to actually paint the loading state.

#### 2. The backend still does expensive work before each frame event

Inside the Rust loop, the code composites the frame and then runs `encode_canvas_as_data_url()` before sending either `Progress` or `Frame` (`src-tauri/src/gif/decode.rs:106-121`). `encode_canvas_as_data_url()` creates a full RGBA image, PNG-encodes it, then base64-encodes it (`src-tauri/src/gif/decode.rs:150-162`).

So even with streaming, the hot path is still "decode frame -> compose full canvas -> PNG encode full canvas -> base64 encode -> serialise/send". The progress bar does not represent only GIF file reading; it sits behind this per-frame image work.

#### 3. The new frontend path is still high-churn

The streamed path avoids one huge `setFrames`, but now does repeated work:

- `addFrame()` copies the frame array on every append: `frames = [...frames, frame]` (`src/lib/stores/frames.svelte.ts:114-119`)
- the timeline rerenders the full `#each` block on every append (`src/lib/components/Timeline.svelte:40-79`)
- each item uses the full frame PNG data URL as an `<img>` source, even though the UI only needs a thumbnail (`src/lib/components/Timeline.svelte:60`)
- the viewer effect depends on `frameStore.selectedFrame`, which depends on `frames`, so appending unrelated frames can cause repeated `Image()` creation and redraws (`src/lib/components/FrameViewer.svelte:7-22`, `src/lib/stores/frames.svelte.ts:29-31`)

This explains why the app can still look frozen even though the data is no longer delivered in one final blob.

#### 4. Byte-progress and loading completion do not match perceived completion

Rust reports progress from `bytes_read / total_bytes` (`src-tauri/src/gif/decode.rs:112-113`). That measures file consumption, not the rest of the work: compositing, PNG/base64 conversion, IPC delivery, image decode, layout, and thumbnail rendering.

The toolbar hides the loading state as soon as the invoke resolves (`src/lib/components/Toolbar.svelte:99-102`), and drag/drop follows the same pattern (`src/routes/+page.svelte:62-64`). This fits the observed "flash near the end": the percentage is late because it is measuring the wrong phase, and the loading UI is removed as soon as the command completes rather than after the queued UI work has visibly settled.

#### 5. The Rust command is still synchronous

`decode_gif_stream` is currently declared as a synchronous Tauri command (`src-tauri/src/lib.rs:17-22`). Tauri's own calling-Rust documentation says async commands are preferred for heavy work to avoid UI freezes or slowdowns and shows channels used from an async command (`https://v2.tauri.app/develop/calling-rust/`).

This does not prove by itself where every millisecond goes, but it does mean the heavy decode path is not structured the way Tauri recommends for long-running work.

### Why the earlier PNG conclusion was too optimistic

The perf work decided PNG was not a bottleneck and added a regression guard around `PngEncoder::new()` (`.ai/planning/2026-04-15 gif-loading-perf/findings.md:66-74`; `src-tauri/src/gif/decode.rs:154-159`).

But the benchmark/test inputs used there are synthetic flat-colour canvases (`src-tauri/src/gif/decode.rs:275-279`, `307-339`). Real screen recordings usually have far more entropy than a solid grey or solid red buffer, so those timings are not strong evidence that full-frame PNG+base64 conversion is cheap for the user's real files.

## Fix Options

### Option 1: Minimal UX fix

Goal: make the app visibly enter a loading state immediately, even if total load time stays high.

Scope:

- force a paint boundary after `startLoading()` / after file-picker confirmation and before decode starts
- stop hiding the loading UI purely on `invoke` resolution
- finish loading from a more explicit completion point, after queued UI updates have drained

Likely outcome:

- better feedback
- the progress bar appears earlier and for longer
- does **not** remove the main cost of loading

### Option 2: Frontend batching and rendering control

Goal: remove the webview starvation that keeps the app looking hung.

Scope:

- queue incoming `frame` events and flush them in batches instead of one-by-one
- stop rebuilding the full `frames` array on every append
- reduce timeline work during load: placeholders, smaller thumbs, or only render visible items
- stop `FrameViewer` from rerendering when the selected frame did not actually change

Likely outcome:

- best targeted fix for responsiveness with relatively local changes
- should directly reduce the "terminate or wait" symptom if the webview is the main source of unresponsiveness
- total decode time may still be longer than desired

### Option 3: Move decode work off the hot Tauri command path

Goal: stop long-running Rust work from behaving like a single synchronous command.

Scope:

- make `decode_gif_stream` async
- run the heavy decode/encode work on a background blocking task
- keep channels for progress/frame delivery

Likely outcome:

- aligns the command with Tauri's heavy-work guidance
- may help app-level responsiveness and reduce the OS freeze prompt
- by itself does not remove the payload size or frontend render cost

### Option 4: Reduce or redesign the frame payload

Goal: remove the largest remaining end-to-end cost.

Scope:

- stop generating a full PNG base64 data URL for every frame during initial load
- send lighter frame data, stage it differently, or lazily create thumbnails / full images
- separate "timeline thumbnail", "current viewer frame", and "export-grade frame data" instead of using the same full PNG string for everything

Likely outcome:

- biggest potential speedup
- biggest architectural change
- most likely option if the app needs genuinely fast large-GIF loads, not only a more responsive spinner

## Code References

- `src/lib/components/Toolbar.svelte:65-103` - open path, streamed channel, loading completion
- `src/lib/components/Toolbar.svelte:189-205` - progress bar rendering
- `src/routes/+page.svelte:44-64` - drag/drop streaming path
- `src/lib/actions.ts:22-50` - path-based open orchestration
- `src/lib/stores/frames.svelte.ts:114-145` - incremental append and loading state
- `src/lib/components/Timeline.svelte:40-79` - eager thumbnail rendering of every frame
- `src/lib/components/FrameViewer.svelte:7-22` - selected-frame image decode/draw effect
- `src-tauri/src/lib.rs:17-22` - synchronous streaming command
- `src-tauri/src/gif/decode.rs:77-148` - streaming decode loop and path entry point
- `src-tauri/src/gif/decode.rs:150-162` - PNG + base64 conversion for each frame
- `.ai/planning/2026-04-15 gif-loading-perf/findings.md:20-48` - old path and original bottleneck analysis
- `.ai/planning/2026-04-15 gif-loading-perf/plan.md:25-85` - implementation plan and claimed completion state

## Open Questions

- How much of the user's real-world delay is Rust-side full-frame PNG/base64 work versus frontend image/layout churn?
- Does moving the decode command to async/background materially reduce the compositor "terminate or wait" prompt on the target Linux/Wayland setup?
- Which UX matters more for the next fix: immediate loading feedback, better responsiveness during load, or total wall-clock load time?
