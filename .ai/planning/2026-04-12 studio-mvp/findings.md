# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: ~12 files across Rust backend and Svelte frontend need creation/modification. Estimated 500+ lines of new code across GIF decode/encode, frame store, and three UI components.

## Requirements

- Open an existing GIF file (via file dialog)
- Decode GIF into individual frames (Rust backend, once on open)
- Display currently selected frame in main viewer (HTML Canvas)
- Timeline at bottom showing all frame thumbnails in sequence
- Drag-and-drop reorder in timeline
- Delete frames from timeline
- Toolbar at top with Export button
- Export modified GIF with sensible defaults (Rust backend via gifski)
- First frame selected on open

## Research Findings

### Current codebase state
- Standard Tauri 2 + SvelteKit skeleton (adapter-static, SPA mode)
- Svelte 5 with runes ($state)
- Rust backend: only a `greet` command in `lib.rs`
- Cargo deps: tauri, tauri-plugin-opener, serde, serde_json
- No existing GIF/image dependencies
- Tauri capabilities: core:default, opener:default — no file dialog yet
- Window: 800x600

### Architecture decisions (from CLAUDE.md)
- GIF decoding: Rust (via Tauri command, once on file open)
- GIF encoding/export: Rust — gifski crate
- Frame state & editing: TypeScript (Svelte store)
- Canvas rendering: Frontend — HTML Canvas / OffscreenCanvas
- IPC boundary principle: pixels on screen interactively → frontend; files/heavy encoding → Rust

### Crate selection
- **GIF decoding**: `gif` crate — straightforward frame-by-frame decoding with per-frame delay info
- **GIF encoding**: `gifski` crate — high-quality GIF encoder as specified in CLAUDE.md
- **Frontend dialog**: `@tauri-apps/plugin-dialog` — for native file open/save dialogs

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| `gif` crate for decoding | Direct frame-by-frame access with delay metadata; lighter than `image` crate for this purpose |
| `gifski` for encoding | Specified in CLAUDE.md; produces high-quality GIFs with dithering |
| Frames as base64-encoded PNG over IPC | Avoids raw RGBA transfer overhead; browser can decode PNG natively for canvas |
| Svelte 5 runes for frame store | Already using Svelte 5; $state is the idiomatic approach |
| `@tauri-apps/plugin-dialog` for file dialogs | Official Tauri plugin for native open/save dialogs |
| Thumbnails generated frontend-side | Resize frames in canvas to avoid extra IPC; keeps Rust lean |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

- Skeleton files: `src-tauri/src/lib.rs`, `src/routes/+page.svelte`
- Tauri config: `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- Cargo: `src-tauri/Cargo.toml`, `package.json`

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
