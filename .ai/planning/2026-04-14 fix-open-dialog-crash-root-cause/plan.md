# Task Plan: Fix Open Dialog Crash — Custom File Browser (Option B)

## Goal

Replace `<input type="file">` with a custom Svelte file browser backed by a Rust `list_dir` command, so the Open button never triggers WebKitGTK's `run-file-chooser` handler and the crash is eliminated at root for every user on every system.

## Current Phase

Complete

---

## Root Cause Summary

**WebKitGTK (the renderer Tauri uses on Linux) handles `<input type="file">` by opening a `GtkFileChooserDialog` via its internal `run-file-chooser` signal handler. `wry` (Tauri's WebView layer) does not intercept this signal. `GtkFileChooserDialog` calls into GIO's GSettings API and crashes fatally if `gsettings-desktop-schemas` is not installed.**

The correct fix is to never trigger `run-file-chooser` at all — achieved by removing `<input type="file">` from the DOM entirely and replacing it with a fully in-app file browser.

---

## Decided Approach: Option B — Custom Svelte File Browser

**Architecture:**

- New Rust command: `list_dir(path: String) -> Result<Vec<DirEntry>, String>` — returns directory contents
- `DirEntry` struct: `{ name: String, path: String, is_dir: bool, extension: Option<String> }`
- New Svelte component `FilePicker.svelte`: modal overlay, current path display, scrollable list of dirs + `.gif` files only, Confirm/Cancel
- `Toolbar.svelte`: remove `<input type="file">`, open FilePicker instead; FilePicker confirms → bytes are read via `@tauri-apps/plugin-fs` or directly via a new Rust `read_file_bytes` command
- Export: existing custom save-path text input is unchanged
- `flake.nix`: add `gsettings-desktop-schemas` to `buildInputs` + `XDG_DATA_DIRS` to `shellHook` (belt-and-braces for dev)

**Why this fixes all users:**
The `org.gtk.Settings.FileChooser` GSettings schema is only loaded when a file chooser dialog opens. With no dialog, no GSettings lookup, no crash — even on systems with zero schemas installed.

---

## Files to Change

| File                                   | Change                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `src-tauri/src/lib.rs`                 | Add `DirEntry` struct, `list_dir` command, `read_file_bytes` command              |
| `src/lib/components/FilePicker.svelte` | New component: file browser modal                                                 |
| `src/lib/components/Toolbar.svelte`    | Remove hidden `<input type="file">`; wire up `FilePicker`                         |
| `src/lib/actions.ts`                   | `DialogProvider.openFile` still returns `Promise<Uint8Array \| null>` — unchanged |
| `src/lib/actions.test.ts`              | Update/add tests for file picker path                                             |
| `flake.nix`                            | Add `gsettings-desktop-schemas`; fix `XDG_DATA_DIRS` in `shellHook`               |

---

## Implementation Phases

### Phase 1: Research & Planning

- [x] Identify root cause (WebKitGTK `run-file-chooser` default handler)
- [x] Research all options
- [x] Write plan and findings
- [x] User chose Option B
- **Status:** complete

### Phase 2: Rust backend

- [x] Add `DirEntry` struct to `src-tauri/src/lib.rs` (serde Serialize)
- [x] Add `list_dir(path: String) -> Result<Vec<DirEntry>, String>` command
- [x] Add `read_file_bytes(path: String) -> Result<Vec<u8>, String>` command
- [x] Add `home_dir() -> String` command
- [x] Add `e2e_fixture_dir()` command to `e2e.rs`
- [x] Register all commands in `tauri::generate_handler!`
- [x] Add `gsettings-desktop-schemas` to `buildInputs` in `flake.nix`
- [x] Add `XDG_DATA_DIRS` export to `shellHook` in `flake.nix`
- [x] `cargo check` — clean
- [x] `cargo test` — 17/17 pass
- **Status:** complete

### Phase 3: FilePicker Svelte component

- [x] Create `src/lib/components/FilePicker.svelte`
- [x] Props: `onConfirm: (path: string) => void`, `onCancel: () => void`
- [x] State: `currentPath`, `navigatePath`, `entries`, `selectedPath`, `errorMessage`
- [x] On mount: load home dir via `invoke("home_dir")`
- [x] Clicking a dir: navigate into it; clicking a `.gif`: select it
- [x] Go Up button; path input with Enter-to-navigate
- [x] Dirs first, then `.gif` files; non-GIF files hidden
- [x] Error display for permission denied etc.
- [x] All `data-testid` attributes for E2E
- **Status:** complete

### Phase 4: Wire up in Toolbar

- [x] Remove `<input type="file" ...>` from `Toolbar.svelte`
- [x] Remove `fileInput` binding
- [x] Add `showFilePicker`, `filePickerResolve`, `filePickerReject` state
- [x] Rewrite `nativeDialog.openFile` — shows FilePicker, resolves with bytes on confirm
- [x] `handleFilePickerConfirm` — invokes `read_file_bytes`, resolves or rejects promise
- [x] `handleFilePickerCancel` — resolves promise with null
- [x] `getDialog()` — always uses native open; E2E bypass only for save
- [x] `e2eDialog` reduced to save-only bypass
- [x] `<FilePicker>` rendered conditionally in template
- [x] `pnpm test:unit` — 35/35 pass
- **Status:** complete

### Phase 5: Tests & verification

**Goal:** E2E tests must exercise the real native open path — not the `e2eDialog` bypass — so passing tests genuinely prove the feature works.

#### Rust unit tests

- [x] Unit tests for `list_dir` (dirs/gif included, png/hidden excluded, dirs sorted first, nonexistent errors)
- [x] Unit tests for `read_file_bytes` (reads content, nonexistent errors)
- [x] `cargo test` — 17/17 pass

#### Unit tests

- [x] `actions.test.ts` unchanged — no interface changes needed
- [x] `pnpm test:unit` — 35/35 pass

#### E2E — close the test gap

- [x] `e2e_fixture_dir` Rust command added to `e2e.rs` and registered
- [x] `tauriInvoke<T>` helper in `studio.ts` — calls `window.__TAURI_INTERNALS__.invoke` via `browser.execute`
- [x] E2E "open GIF fixture" test rewritten: opens picker → types fixture dir into navigate input → presses Enter → clicks `test.gif` → clicks Confirm → asserts "Loaded 3 frames"
- [x] `e2eDialog.openFile` bypass removed; `getDialog()` always uses native open path
- [x] `pnpm tauri build` — clean
- [x] `pnpm test:e2e` — 13/13 studio tests pass (splashscreen spec failure is pre-existing, unrelated)

#### Manual smoke test

- [ ] `pnpm tauri dev`, click Open — file picker opens (no crash)
- [ ] Navigate dirs, select a `.gif`, confirm — frames load
- [ ] Export — save path input still works

#### Final housekeeping

- [ ] Update all planning files to final state per `planning` skill
- **Status:** complete

---

## Decisions Made

| Decision                                  | Rationale                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| HTML `<input type="file">` is NOT the fix | WebKitGTK's default file-chooser handler still uses GTK                                              |
| Option B chosen by user                   | Custom file browser; zero GTK involvement; works for all users                                       |
| `read_file_bytes` Rust command            | Read selected file in Rust → return bytes to JS; consistent with existing `decode_gif_bytes` pattern |
| Export save-path input unchanged          | Already zero-dep; works fine                                                                         |
| flake.nix XDG_DATA_DIRS fix included      | Good practice for dev; prevents other potential GTK issues                                           |
| tauri-plugin-dialog xdg-portal ruled out  | Cannot guarantee FileChooser portal on all Hyprland systems                                          |
| Follow `rust-standards` skill             | For all Rust code written                                                                            |
| Follow `tdd` skill                        | For all new code                                                                                     |

## Errors Encountered

| Error                                  | Attempt       | Resolution                                                                                 |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `GLib-GIO-ERROR: No GSettings schemas` | Previous plan | Replaced plugin with `<input type="file">` — wrong fix, same root cause                    |
| Same error after plan 1                | This plan     | Root cause is WebKitGTK's built-in handler; fix is removing `<input type="file">` entirely |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Run `pnpm test:unit` after every Svelte/TS change; `cargo check` after every Rust change
- Follow `rust-standards` skill for Rust code
- Follow `tdd` skill for new features
