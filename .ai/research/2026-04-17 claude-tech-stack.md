---
date: 2026-04-17T05:45:17+01:00
git_commit: a484da610655f5acb5da20938caa2f1ce6f03d27
branch: main
repository: screeny
topic: "Is the Tech Stack section in CLAUDE.md still up to date?"
status: complete
last_updated: 2026-04-17
last_updated_by: GitHub Copilot
---

# Research: Is the Tech Stack section in CLAUDE.md still up to date?

**Date**: 2026-04-17T05:45:17+01:00
**Git Commit**: `a484da610655f5acb5da20938caa2f1ce6f03d27`
**Branch**: `main`
**Repository**: `screeny`

## Research Question

Check whether the `Tech Stack` section in `CLAUDE.md` matches the current repository, and identify any changes needed.

## Summary

The section is **partly up to date**.

What still matches:

- Desktop shell is Tauri, and specifically **Tauri 2** (`package.json:18-19,25`; `src-tauri/Cargo.toml:17-22`; `src-tauri/tauri.conf.json:1-10`)
- Backend is Rust (`src-tauri/Cargo.toml:1-31`; `src-tauri/src/main.rs:4-6`)
- GIF decoding and GIF export are implemented in Rust (`src-tauri/src/lib.rs:17-27`; `src-tauri/src/gif/decode.rs:77-179`; `src-tauri/src/gif/encode.rs:7-61`)
- Frame state and editing live in frontend TypeScript state (`src/lib/stores/frames.svelte.ts:3-145`)
- Rendering uses a frontend canvas (`src/lib/components/FrameViewer.svelte:5-27`)

What no longer matches:

1. **Frontend framework** is now more accurately **SvelteKit + Svelte 5 + TypeScript**, not just `Svelte + TypeScript` (`package.json:22-24,31-35`; `svelte.config.js:8-16`; `vite.config.js:1-10`; `src/routes/+layout.ts:1-5`)
2. **Screen recording** is **not currently implemented** in the repo, and `ashpd` / `PipeWire` are not present as runtime dependencies (`src-tauri/Cargo.toml:20-31`; `src-tauri/src/lib.rs:123-134`; `src/lib/components/Toolbar.svelte:165-202`)
3. **OffscreenCanvas** is not used in the current rendering path; the viewer uses a regular `HTMLCanvasElement` and `2d` context (`src/lib/components/FrameViewer.svelte:5-21,27`)

## Detailed Findings

### Frontend framework

The repo uses SvelteKit conventions and tooling, not plain standalone Svelte:

- `@sveltejs/kit` and `@sveltejs/adapter-static` are dependencies (`package.json:22-24`)
- `sveltekit()` is the Vite plugin (`vite.config.js:1-10`)
- `svelte.config.js` configures the SvelteKit adapter (`svelte.config.js:8-16`)
- Routing lives under `src/routes/` and SSR is disabled in `+layout.ts` for the desktop app (`src/routes/+layout.ts:1-5`)

### Desktop shell and backend

The app is built on Tauri 2 with a Rust backend:

- JS side uses `@tauri-apps/api` and `@tauri-apps/cli` version `^2` (`package.json:18-19,25`)
- Rust side uses `tauri = { version = "2" }` and `tauri-build = { version = "2" }` (`src-tauri/Cargo.toml:17-22`)
- Tauri config schema is `config/2` (`src-tauri/tauri.conf.json:1`)

### GIF decode and export

GIF open/export is implemented in Rust and wired through Tauri commands:

- `decode_gif_stream` and `export_gif` are registered commands (`src-tauri/src/lib.rs:17-27,123-134`)
- Decoding uses the `gif` crate and streams `progress` / `frame` / `complete` events (`src-tauri/src/gif/decode.rs:77-132`; `src-tauri/src/gif/mod.rs:4-16`)
- Export uses `gifski` (`src-tauri/src/gif/encode.rs:18-34`)
- The Rust manifest declares `gif`, `gifski`, `image`, `imgref`, `rgb`, and `base64` (`src-tauri/Cargo.toml:23-30`)

### Screen recording

The documented recording stack does not exist in the current codebase:

- No recording command is registered in the Tauri backend (`src-tauri/src/lib.rs:123-134`)
- Toolbar actions are Open, Close, Export, Play, and Stop; no recording UI is present (`src/lib/components/Toolbar.svelte:165-202`)
- `src-tauri/Cargo.toml` has no `ashpd` or `pipewire` dependency (`src-tauri/Cargo.toml:20-31`)

### Frame state and editing

Frame state is held entirely in frontend TypeScript/Svelte state:

- `Frame` is `{ id, imageData, duration, width, height }` (`src/lib/types.ts:1-7`)
- The main frame store tracks frames, selection, playback, and loading (`src/lib/stores/frames.svelte.ts:3-145`)
- Reordering and deletion happen in the timeline/store layer on the frontend (`src/lib/stores/frames.svelte.ts:57-90`)

### Canvas rendering

Rendering is via a regular HTML canvas:

- `FrameViewer.svelte` binds an `HTMLCanvasElement` (`src/lib/components/FrameViewer.svelte:5,27`)
- It gets a `"2d"` context and draws the selected frame into that canvas (`src/lib/components/FrameViewer.svelte:11-21`)
- No `OffscreenCanvas` usage was found in the repo

## Suggested CLAUDE.md replacement

```md
### Tech Stack

- Desktop shell: Tauri 2
- Frontend framework: SvelteKit + Svelte 5 + TypeScript
- Frontend package manager: pnpm
- Backend: Rust
- GIF decoding: Rust - `gif` crate, exposed via Tauri command streaming decode events
- GIF encoding/export: Rust - `gifski` crate
- Screen recording: Not implemented yet
- Frame state & editing: Frontend TypeScript state (`.svelte.ts` store)
- Canvas rendering: Frontend - HTML Canvas
```

## Code References

- `CLAUDE.md:5-15` - Current Tech Stack section being checked
- `package.json:6-35` - Frontend, tooling, Tauri JS, SvelteKit, Svelte 5
- `svelte.config.js:8-16` - SvelteKit adapter configuration
- `vite.config.js:1-10` - SvelteKit Vite plugin
- `src/routes/+layout.ts:1-5` - SPA/SSR-disabled frontend setup
- `src-tauri/Cargo.toml:17-31` - Tauri 2 and Rust-side runtime dependencies
- `src-tauri/tauri.conf.json:1-10` - Tauri 2 config schema and frontend linkage
- `src-tauri/src/lib.rs:17-27,123-134` - Registered Tauri commands
- `src-tauri/src/gif/decode.rs:77-179` - Rust GIF decode pipeline
- `src-tauri/src/gif/encode.rs:7-61` - Rust GIF export pipeline
- `src/lib/stores/frames.svelte.ts:3-145` - Frontend frame state/editing
- `src/lib/components/FrameViewer.svelte:5-27` - HTML canvas rendering path
- `src/lib/components/Toolbar.svelte:165-202` - Implemented top-level toolbar actions

## Open Questions

- None for this comparison. The current repo state is clear enough to update the section directly.
