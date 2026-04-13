# Findings & Decisions

## Plan Size

**Multi-phase: No**
Reasoning: 2–4 files modified, single approach to implement and test.

## Requirements

- Clicking "Open" must open a file picker to select a GIF
- Must not crash the app
- Must work on Linux/Wayland (Hyprland) — the primary target
- **Must work for every Hyprland user** — no optional system packages (e.g. `xdg-desktop-portal-gtk`) can be required
- Must return file contents to the Rust backend for GIF decoding

## Research Findings

### Error details

```
(screeny:55972): GLib-GIO-ERROR **: 05:45:27.120: No GSettings schemas are installed on the system
```

- `GLib-GIO-ERROR` is a **fatal** `g_error()` call — the process is killed immediately, no recovery possible
- Root cause: `gsettings-desktop-schemas` package not installed on the user's Hyprland system
- GTK's file dialog internally calls into GIO/DConf, which requires this package
- `tauri-plugin-dialog` on Linux uses GTK file dialogs → inherits this requirement

### History of failed attempts

| Attempt | Crate/approach | Result | Root cause of failure |
|---|---|---|---|
| 1 (cac1600?) | `tauri-plugin-dialog` | Crash — GLib-GIO-ERROR | GTK requires `gsettings-desktop-schemas` |
| 2 (afd0e7f) | `rfd` (default GTK backend) | Silent / did nothing | Same GTK dependency; also GTK must run on main thread but Tauri async commands run on Tokio thread pool |
| 3 (26567b5) | `ashpd` (`OpenFileRequest`) | Silent / error shown | XDG portal file chooser may not be configured on Hyprland; no window handle passed |
| 4 (37a9220, current) | `tauri-plugin-dialog` (again) | Crash — same GLib-GIO-ERROR | Same root cause as attempt 1 |

### Why rfd silently failed

- Default `rfd` on Linux links against GTK — same `gsettings-desktop-schemas` dependency
- GTK requires the **main thread**; Tauri async `#[tauri::command]` runs on Tokio's thread pool → GTK calls on non-main thread → undefined/silent failure
- `rfd` has an `xdg-portal` feature (`rfd = { features = ["xdg-portal"] }`) which bypasses GTK entirely — this was **never tried**

### Why ashpd silently failed

- `ashpd` `OpenFileRequest` requires the XDG Desktop Portal's FileChooser interface
- `xdg-desktop-portal-hyprland` does **not** implement FileChooser — it only implements ScreenCast and RemoteDesktop
- FileChooser requires a separate backend: `xdg-desktop-portal-gtk` or `xdg-desktop-portal-kde`
- If neither is installed/running, the D-Bus call returns an error (silently swallowed or shows an error message)
- Additionally, no window parent handle was passed — portal requires this for modal dialogs
- Conclusion: ashpd file chooser will only work if the user installs `xdg-desktop-portal-gtk`

### Tauri 2 and HTML `<input type="file">`

- Tauri 2 **does** expose `file.path` on `File` objects via a custom property injected into the webview (confirmed pattern from Tauri 2 docs / forum)
- Alternatively: read file as `ArrayBuffer` in JS and pass bytes to Rust — works regardless of path exposure
- Completely bypasses GTK, GSettings, portals, D-Bus — zero system dependencies
- Works on all platforms (Linux, Windows, macOS)
- **Limitation**: only works for Open (picking a file), not for Save (choosing a save path)

### Save dialog alternatives (Export)

| Option | Notes |
|---|---|
| `rfd` + `xdg-portal` feature | Uses portal; requires `xdg-desktop-portal-gtk` or `-kde` for the file chooser interface |
| `ashpd` `SaveFileRequest` | Same portal dependency as above |
| Custom Svelte "save path" input | User types a path or we default to a sensible location; no system dependency |
| Pass save path via Rust command default | Auto-generate a timestamped filename in `~/Downloads` or `~/Pictures` |

## Technical Decisions

| Decision | Rationale |
|---|---|
| HTML `<input type="file">` for Open | Zero system dependencies; works on all platforms; no GTK, no portal |
| Bytes (`Vec<u8>`) for decode, not path | Standard `file.arrayBuffer()` browser API; avoids relying on undocumented Tauri `file.path` injection |
| Custom Svelte save-path text input | Only zero-dep save option; `xdg-desktop-portal-gtk` (needed for portal FileChooser) is not universally installed on Hyprland |
| Remove all GTK/portal crates entirely | Cannot require optional system packages for any end user |
| Keep `DialogProvider` abstraction | E2E tests rely on it; don't break it |

## Issues Encountered

| Issue | Resolution |
|---|---|
| `tauri-plugin-dialog` crashes with GLib-GIO-ERROR | Root cause: missing `gsettings-desktop-schemas`; solution: don't use GTK-based dialogs |
| `rfd` silent failure | GTK threading + missing schemas; fix: use `xdg-portal` feature; OR skip rfd for open entirely |
| `ashpd` file chooser silent failure | Missing portal backend for FileChooser; not fixable in code alone |

## Resources

- rfd xdg-portal feature: `rfd = { version = "0.15", features = ["xdg-portal"] }`
- Tauri 2 File API: `event.target.files[0]` — `.path` may be available, `.arrayBuffer()` always works
- `GSETTINGS_BACKEND=memory` env var: makes GIO use in-memory settings (experimental workaround, not recommended)
- `xdg-desktop-portal-hyprland` implements: ScreenCast, RemoteDesktop (NOT FileChooser)
- `xdg-desktop-portal-gtk` implements: FileChooser (install separately on Hyprland)
