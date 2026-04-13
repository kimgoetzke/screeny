# Task Plan: Studio MVP — Open, Edit, Export GIF

## Goal

Turn the skeleton Tauri app into a GIF studio that can open a GIF, display frames, allow reorder/delete via a timeline, and export the result.

## Current Phase

Complete

## Phases

### Phase 1: Planning

- [x] Explore codebase
- [x] Document findings and architecture decisions
- [x] Create planning files
- [x] Write plan
- **Status:** complete

### Phase 2: Rust Backend — GIF Decode & Encode

Add Rust dependencies and implement two Tauri commands: `decode_gif` and `export_gif`.

- [x] Add crate dependencies to `src-tauri/Cargo.toml`: `gif`, `gifski`, `image`, `imgref`, `rgb`, `base64`
- [x] Add Tauri dialog plugin: `tauri-plugin-dialog` to Cargo.toml and register in `lib.rs`
- [x] Implement `decode_gif` command (decode.rs — file + in-memory variants, frame compositing with disposal methods)
- [x] Implement `export_gif` command (encode.rs — gifski with threaded writer)
- [x] Write tests: 6 decode tests + 3 encode tests, all passing
- [x] Update `tauri.conf.json` window size to 1200x800
- [x] Add dialog permissions to `src-tauri/capabilities/default.json`
- [x] Update planning files per `planning` skill

- **Status:** complete

### Phase 3: Frontend — Frame Store & Types

Create the TypeScript frame store and type definitions.

- [x] Create `src/lib/types.ts` — Frame and ExportFrame interfaces
- [x] Create `src/lib/stores/frames.svelte.ts` — Svelte 5 runes store with setFrames, selectFrame, deleteFrame, reorderFrames, clear, hasFrames
- [x] Write 19 tests for all store operations — all passing
- [x] Set up vitest in vite.config.js
- [x] Update planning files per `planning` skill

- **Status:** complete

### Phase 4: Frontend — UI Components

Build the three UI sections: Toolbar, FrameViewer, Timeline. Replace the skeleton page.

- [x] Install `@tauri-apps/plugin-dialog` 2.7.0 via pnpm
- [x] Create Toolbar.svelte — Open (file dialog → decode_gif) and Export (save dialog → export_gif) buttons with loading/status
- [x] Create FrameViewer.svelte — reactive canvas rendering of selected frame via $effect
- [x] Create Timeline.svelte — scrollable thumbnail strip with click-to-select, HTML5 drag-and-drop reorder, delete button (hover-reveal)
- [x] Rewrite +page.svelte — flexbox layout (Toolbar top, FrameViewer middle flex-grow, Timeline bottom 140px), global dark theme CSS
- [x] Update app.html title to "Screeny"
- [x] svelte-check: 0 errors, 0 warnings; vitest: 19/19 passing
- [x] Update planning files per `planning` skill

- **Status:** complete

### Phase 5: Integration Testing & Polish

End-to-end verification and final tweaks.

- [x] Full `pnpm tauri build` succeeds — binary, .deb, .rpm all produced (AppImage fails due to missing xdg-open in env, not a code issue)
- [x] `cargo test`: 9/9 passing, 0 warnings
- [x] `npx vitest run`: 19/19 passing
- [x] `pnpm check` (svelte-check): 0 errors, 0 warnings
- [x] Fixed unused import warning for Cursor
- [x] Final update of all planning files per `planning` skill

- **Status:** complete

## Key Questions

1. Frame data format over IPC — base64 PNG vs raw RGBA? (Decided: base64 PNG — see findings.md)
2. Thumbnail generation — Rust-side vs frontend-side? (Decided: frontend-side)
3. Memory limits for large GIFs? (Deferred — no limit for MVP)

## Decisions Made

| Decision                              | Rationale                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| base64 PNG for IPC frame data         | Browser-native decoding; simpler canvas rendering; one-time encode cost is acceptable |
| Frontend-side thumbnails              | Follows IPC boundary principle; avoids extra Rust work                                |
| `gif` crate for decoding              | Direct frame-by-frame with delay metadata                                             |
| `gifski` for encoding                 | Specified in CLAUDE.md; high-quality output                                           |
| HTML5 drag-and-drop for reorder       | No extra dependencies; sufficient for timeline reorder                                |
| Svelte 5 runes (.svelte.ts) for store | Idiomatic for current Svelte version; already in use                                  |
| `rfd` with `xdg-portal` feature       | Direct portal dialogs; avoids GTK GSettings crash on minimal Linux/Wayland setups     |

## Errors Encountered

| Error                                                                    | Attempt | Resolution                                                                                                                                |
| ------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| GLib-GIO-ERROR: No GSettings schemas installed (app crash on Open click) | 1       | Replaced `tauri-plugin-dialog` (GTK file chooser) with `rfd` + `xdg-portal` feature (uses xdg-desktop-portal directly, no GTK dependency) |

## Notes

- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- Each phase must end with planning file updates
- GIF frame compositing: the `gif` crate gives per-frame disposal methods — need to handle `RestoreToBackground` and `RestoreToPrevious` by compositing onto a canvas buffer, not just taking raw frame data
