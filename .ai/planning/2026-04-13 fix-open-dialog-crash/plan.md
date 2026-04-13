# Task Plan: Fix Open Dialog Crash

## Goal

Replace all GTK-based file dialogs with crash-free, zero-system-dependency alternatives so Open and Export work reliably for any Hyprland/Wayland user.

## Current Phase

Phase 1

## Approach (decided)

**Open dialog**: HTML `<input type="file">` — no GTK, no portal, no schemas required.  
**Decode**: pass file bytes (`Vec<u8>`) from JS to Rust — avoids relying on undocumented `file.path` Tauri internals.  
**Save/Export dialog**: Custom Svelte save-path text input — zero system dependencies, works on every Hyprland setup.

All GTK/portal/rfd/ashpd dependencies removed entirely.

### Why rfd+xdg-portal is ruled out for Save

`xdg-desktop-portal-hyprland` does **not** implement FileChooser. FileChooser requires `xdg-desktop-portal-gtk` or `-kde` as an additional backend, which many Hyprland users do not have installed. We cannot require it.

### What "bytes vs path" means (Q2 clarification)

- **Path approach**: Tauri secretly injects a `.path` property into browser `File` objects so JS can read the filesystem path (e.g. `/home/user/mygif.gif`). We pass this string to Rust, which reads the file from disk. Simpler code, but relies on an undocumented Tauri behaviour that could change.
- **Bytes approach**: JS reads the file content using the standard browser `file.arrayBuffer()` API (always available, documented, cross-browser). The raw bytes are sent over IPC to a new Rust command `decode_gif_bytes(data: Vec<u8>)`, which decodes from memory. Requires changing the Rust command signature but has no hidden dependencies.
- **Decision**: Use bytes — more portable and correct.

---

## Eliminated options

| Option                | Why eliminated                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| `tauri-plugin-dialog` | GTK → GIO → fatal GLib crash without `gsettings-desktop-schemas`              |
| `rfd` default (GTK)   | Same GTK dep + GTK must run on main thread, Tauri async runs on Tokio pool    |
| `ashpd` FileChooser   | Hyprland portal doesn't implement FileChooser; needs `xdg-desktop-portal-gtk` |
| `rfd` + `xdg-portal`  | FileChooser portal not universally available on Hyprland                      |
| System fix only       | Can't require users to install GNOME packages                                 |

---

## Implementation Phases

### Phase 1: Remove GTK dialog dependency

- [x] Remove `tauri-plugin-dialog = "2"` from `src-tauri/Cargo.toml`
- [x] Remove `.plugin(tauri_plugin_dialog::init())` from `src-tauri/src/lib.rs`
- [x] Remove `"dialog:default"` from `src-tauri/capabilities/default.json`
- [x] Run `pnpm remove @tauri-apps/plugin-dialog` to remove JS package
- [x] Remove `import { open, save } from "@tauri-apps/plugin-dialog"` from `Toolbar.svelte`
- **Status:** complete

### Phase 2: Implement Open dialog via HTML file input (bytes approach)

- [x] Add `decode_gif_bytes(data: Vec<u8>)` command to `src-tauri/src/lib.rs`
- [x] Remove `#[cfg(test)]` gate from `decode_gif_bytes` in `src-tauri/src/gif/decode.rs`
- [x] Register `decode_gif_bytes` in `tauri::generate_handler!`
- [x] Add hidden `<input type="file" accept=".gif">` to `Toolbar.svelte`
- [x] Rewrite `nativeDialog.openFile` using `change`/`cancel` events + `arrayBuffer()`
- [x] Update `DialogProvider.openFile` → `Promise<Uint8Array | null>` in `actions.ts`
- [x] Update `GifBackend.decode(data: Uint8Array)` in `actions.ts`
- [x] Update `openGif` to pass bytes
- [x] Update `actions.test.ts` for new signatures
- [x] `pnpm test:unit` — 30 tests pass
- **Status:** complete

### Phase 3: Implement Export/Save dialog via custom Svelte path input

- [x] Add `suggest_export_path()` Tauri command in `lib.rs` (returns `$HOME/export.gif`)
- [x] Add save path state + inline text input UI to `Toolbar.svelte`
- [x] Promise-based `nativeDialog.saveFile` tied to Confirm/Cancel buttons
- [x] `e2e_open_fixture` updated to return `Vec<u8>` (bytes) in `e2e.rs`
- [x] `e2eDialog.openFile` converts `number[]` → `Uint8Array`
- **Status:** complete

### Phase 4: Test and verify

- [x] `cargo check` — clean
- [x] `pnpm test:unit` — 30/30 pass
- [ ] Manual: `pnpm tauri dev`, click Open, pick a GIF, verify frames load
- [ ] Manual: Export, confirm save path, verify GIF written to disk
- [ ] Manual: drag-and-drop still works (regression)
- **Status:** in_progress

---

## Files to change

| File                                  | Change                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| `src-tauri/Cargo.toml`                | Remove `tauri-plugin-dialog`; no new crates needed           |
| `src-tauri/src/lib.rs`                | Remove dialog plugin init; add `decode_gif_bytes` command    |
| `src-tauri/src/gif/decode.rs`         | Add `decode_gif_bytes(data: &[u8])` function                 |
| `src-tauri/capabilities/default.json` | Remove `"dialog:default"`                                    |
| `src/lib/actions.ts`                  | Update `DialogProvider`, `GifBackend`, `openGif` for bytes   |
| `src/lib/actions.test.ts`             | Update tests for new byte-based signatures                   |
| `src/lib/components/Toolbar.svelte`   | Hidden file input; save path UI; remove plugin-dialog import |
| `package.json` / `pnpm-lock.yaml`     | Remove `@tauri-apps/plugin-dialog`                           |

## Key Questions

All answered. See `questions.md`.

## Decisions Made

| Decision                      | Rationale                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| HTML file input for Open      | Zero deps; works on every Hyprland setup                    |
| Bytes (`Vec<u8>`) for decode  | Standard browser API; no Tauri internals; portable          |
| Custom Svelte save-path input | Only zero-dep save option; portal not universal on Hyprland |
| Remove all GTK/portal crates  | Cannot require optional system packages for end users       |

## Errors Encountered

| Error                                  | Attempt | Resolution                        |
| -------------------------------------- | ------- | --------------------------------- |
| `GLib-GIO-ERROR: No GSettings schemas` | 1, 4    | Don't use GTK-backed dialogs      |
| rfd: silent/no-op                      | 2       | GTK threading + schema issue      |
| ashpd: silent/error                    | 3       | No FileChooser portal on Hyprland |
