## Project Overview

A cross-platform GIF recording and editing application inspired by [ScreenToGif](https://www.screentogif.com/), targeting Linux/Wayland (Hyprland) as the must-have platform, with Windows and macOS as stretch goals.

### Tech Stack

- Desktop shell: Tauri 2
- Frontend framework: SvelteKit + Svelte 5 + TypeScript
- Frontend package manager: pnpm
- Backend: Rust
- GIF decoding: Rust — `gif` crate via Tauri command streaming decode events
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
│ │             width, height }                  │    │
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
│ │ save/load     │ │              │ │          │     │
│ └───────────────┘ └──────────────┘ └──────────┘     │
└─────────────────────────────────────────────────────┘
```

#### IPC Boundary Principle

> If it touches pixels on screen interactively → frontend. If it touches files or does heavy encoding → Rust.

All interactive editing (reorder, delete, scrub timeline, change frame duration) is pure Svelte store mutation — zero IPC. Rust is only invoked for file operations and encode/decode, which happen once at well-defined moments.

### UI Patterns

#### Modal / overlay dialogs

Dialogs are rendered conditionally in the parent component using `{#if show}<Dialog />` — not via a global store or portal. The parent holds the boolean state and passes callback props (`onConfirm`, `onCancel`). See `FilePicker.svelte` and `NotificationDialog.svelte` for the established pattern.

### Testing

#### Unit tests

- Runner: Vitest (`pnpm test:unit` → `vitest run`)
- All unit tests use **SSR rendering only** via `render()` from `svelte/server`. This returns an HTML string; tests assert on the string with `.toContain()`.
- **Do not use `mount()` from `svelte`** — the project's Vite/SvelteKit setup compiles Svelte components in SSR mode for tests. The client-side `mount` is not available without significant vitest reconfiguration that conflicts with the SvelteKit plugin.
- Test files live alongside source files: `src/lib/components/Foo.test.ts`
- Use `data-testid` attributes for element selection in assertions.

#### E2E tests

- Runner: WebdriverIO + tauri-driver (`pnpm test:e2e`)
- Requires: built app (`pnpm tauri build`), `tauri-driver` on `PATH`, `WebKitWebDriver` on `PATH`
- Test files: `tests/e2e/specs/`
- Use `jsClick(selector)` helper (defined in `studio.ts`) to bypass WebKitWebDriver interactability checks.
