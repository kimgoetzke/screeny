## Project Overview

A cross-platform GIF recording and editing application inspired by [ScreenToGif](https://www.screentogif.com/), targeting Linux/Wayland (Hyprland) as the must-have platform, with Windows and macOS as stretch goals.

### Tech Stack

- Desktop shell: Tauri
- Frontend framework: Svelte + TypeScript
- Frontend package manager: pnpm
- Backend: Rust
- GIF decoding: Rust (via Tauri command, once on file open)
- GIF encoding/export: Rust — gifski crate
- Screen recording: Rust — ashpd crate + PipeWire (xdg-desktop-portal)
- Frame state & editing: TypeScript (Svelte store)
- Canvas rendering: Frontend — HTML Canvas / OffscreenCanvas

### Architecture

#### Overview

```
┌─────────────────────────────────────────────────────┐
│ Tauri Shell                                         │
│ (window management, native dialogs, OS integration) │
├─────────────────────────────────────────────────────┤
│ Frontend (Svelte + TypeScript)                      │
│                                                     │
│ ┌─────────────┐ ┌──────────────┐ ┌────────────┐     │
│ │ Recorder    │ │ Studio       │ │ Exporter   │     │
│ │ View        │ │ View         │ │ UI         │     │
│ └─────────────┘ └──────────────┘ └────────────┘     │
│                                                     │
│ ┌──────────────────────────────────────────────┐    │
│ │ Frame Store (Svelte store)                   │    │
│ │ Frame[] = { id, imageData, duration,         │    │
│ │             thumbnail }                      │    │
│ │ + all edit operations (pure array ops)       │    │
│ └──────────────────────────────────────────────┘    │
├──────────────────────┬──────────────────────────────┤
│ IPC boundary         │ Two meaningful crossings:    │
│                      │ 1. Open → Rust decodes,      │
│                      │    returns raw frames once   │
│                      │ 2. Export → frontend sends   │
│                      │    frames to Rust once       │
├──────────────────────┴──────────────────────────────┤
│ Rust Backend (Tauri commands)                       │
│                                                     │
│ ┌───────────────┐ ┌──────────────┐ ┌──────────┐     │
│ │ File I/O      │ │ GIF decode/  │ │ Screen   │     │
│ │ project       │ │ encode       │ │ Recorder │     │
│ │ save/load     │ │ (gifski)     │ │ (ashpd/  │     │
│ └───────────────┘ └──────────────┘ │ PipeWire │     │
│                                    └──────────┘     │
└─────────────────────────────────────────────────────┘
```

#### IPC Boundary Principle

> If it touches pixels on screen interactively → frontend. If it touches files or does heavy encoding → Rust.

All interactive editing (reorder, delete, scrub timeline, change frame duration) is pure Svelte store mutation — zero IPC. Rust is only invoked for file operations and encode/decode, which happen once at well-defined moments.

### UI / Views

#### Recorder UI

- Options: number of frames, capture mode (fullscreen with monitor selection / window / select area)
- Visual pause/continue and stop controls during recording

#### Studio UI — three sections:

- Toolbar at the top
- Main viewer — current frame rendered to canvas
- Timeline at the bottom — scrollable strip of frame thumbnails in sequence

### Planned Features (roughly by priority)

#### Phase 1 — Studio MVP (start here)

- Open existing GIF
- Frame management: delete frames, reorder frames, change per-frame duration
- Export GIF (with size and quality options via gifski)
- Save/load project files (JSON metadata + cached frame data)

#### Phase 2 — Recording

- Recorder UI with capture mode selection
- Rust backend: PipeWire + xdg-desktop-portal (ashpd) for Wayland capture
- Pause/resume/stop controls

#### Phase 3 — Advanced Studio Features

- Import frames from other GIFs
- Text overlay
- Crop / resize
- Possibly: mouse movement highlight, key press visualisation, image overlay

### Key Constraints

- Linux + Wayland (Hyprland) is the must-have target
- Cross-platform (Windows, macOS) is a goal but not a day-one requirement
- No cloud, no third-party APIs, fully -
