# Findings & Decisions

## Plan Size

**Multi-phase: No** (for Option A) / **Multi-phase: Yes** (for Option B)

Option A (GSETTINGS_BACKEND=memory + flake.nix fix): 2 files modified, ~10 lines. Single phase.
Option B (custom Svelte file browser): ~5–8 files, ~200+ lines. Multi-phase.

## Requirements

- Clicking Open must open a file picker to select a GIF
- App must NOT crash
- Must work on Linux/Wayland (Hyprland) for ALL users regardless of system packages installed
- NixOS flake dev environment must also work (`pnpm tauri dev` must not crash)
- App must remain portable (Windows, macOS stretch goals)

## Root Cause (Confirmed)

The previous plan was wrong in its diagnosis. Replacing `tauri-plugin-dialog` with `<input type="file">` did NOT remove the GTK dependency — it moved it.

### How the crash actually happens

1. User clicks Open → Svelte calls `fileInput.click()` on a hidden `<input type="file">`
2. WebKitGTK receives the click event and emits its `run-file-chooser` signal
3. `wry` (Tauri's WebView library) does NOT connect a custom handler for `run-file-chooser`
4. WebKitGTK's **default handler** fires: it opens a `GtkFileChooserDialog`
5. `GtkFileChooserDialog` calls `g_settings_new("org.gtk.Settings.FileChooser")` via GIO
6. GIO searches for installed GSettings schemas — finds none → **fatal `g_error()` → process killed**

### Why the previous fix failed

The previous plan assumed the crash came from Tauri's Rust-level `tauri-plugin-dialog` (which also uses GTK under the hood). It was replaced with `<input type="file">`, which is a standard HTML element. But on Linux, WebKitGTK — Tauri's underlying WebView renderer — handles that element by calling GTK's own file dialog. The crash moved from Rust code to WebKitGTK's C code. Same root cause.

### Why NixOS is affected specifically

On NixOS, packages do NOT install to `/usr/share` by default. GLib searches for GSettings schemas in `XDG_DATA_DIRS` (which defaults to `/usr/local/share:/usr/share`). On a Nix-based system, even if `gsettings-desktop-schemas` is in the Nix store, GLib won't find it unless `XDG_DATA_DIRS` is set to include the Nix store path. The flake.nix currently does NOT set this, so schemas are not found even though the package is available.

End users on non-NixOS Hyprland may also be affected if they installed a minimal system without `gsettings-desktop-schemas` (e.g. no GNOME apps).

### Key technical facts

- `wry` v0.x (all versions): does not connect `WebKitWebView::run-file-chooser` signal — confirmed in `src/webkitgtk/mod.rs`
- `GLib-GIO-ERROR` is a **fatal** `g_error()` — not recoverable, process is killed
- `GSETTINGS_BACKEND=memory`: makes GIO use volatile in-memory settings, bypasses schema loading entirely → no crash
- `GSETTINGS_BACKEND=memory` side effect: file dialog preferences (last directory, sort order) don't persist across app sessions — acceptable trade-off
- Setting `GSETTINGS_BACKEND` must happen before GTK initialises (i.e. before `screeny_lib::run()`)

## Research Findings

### WebKitGTK `run-file-chooser` signal
- Documented in WebKitGTK API: when `<input type="file">` is clicked, the WebView emits this signal
- Default handler: opens `GtkFileChooserDialog` (requires GSettings schemas)
- Custom handler returning `TRUE` prevents the default — wry does not do this
- Source: https://webkitgtk.org/reference/webkit2gtk/stable/signal.WebView.run-file-chooser.html

### GSETTINGS_BACKEND=memory
- Recognised emergency escape hatch to bypass GSettings schema loading
- Safe: cannot corrupt data; only downgrades file dialog persistence
- Sets GIO into volatile in-memory mode — all schema values use compiled-in defaults
- Source: https://bugzilla.mozilla.org/show_bug.cgi?id=797535

### NixOS XDG_DATA_DIRS fix (for dev)
- Standard NixOS fix for GTK GSettings schema crashes in dev shells
- Must be in `shellHook` (not as a bare Nix attribute — no shell expansion there)
- Pattern: `export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/...`
- Source: https://github.com/tauri-apps/tauri-docs/issues/1560, https://wiki.nixos.org/wiki/Tauri

### tauri-plugin-dialog with xdg-portal feature
- `tauri-plugin-dialog = { version = "2.5.0", default-features = false, features = ["xdg-portal"] }` bypasses GTK in Rust code
- BUT: on Hyprland, FileChooser portal is NOT provided by `xdg-desktop-portal-hyprland`; requires `xdg-desktop-portal-gtk` or `-kde`
- Falls back to `zenity` if portal unavailable — zenity is GTK and may also need schemas
- **Cannot guarantee zero system deps for all Hyprland users**
- Ruled out as a universal fix

### Custom Svelte file browser
- Use a Rust command `list_dir(path)` → return file/dir entries → render in Svelte
- Zero GTK involvement at any level
- Most robust, most portable, zero system deps
- Requires building a usable file-browser UI (~200+ lines)

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| **Option B chosen: custom Svelte file browser** | User-selected; zero GTK involvement; works for all users with zero system deps |
| Ruled out tauri-plugin-dialog + xdg-portal | Cannot guarantee FileChooser portal or zenity work without deps on all Hyprland setups |
| Ruled out GSETTINGS_BACKEND=memory as primary fix | Option B is cleaner; no env var hacks needed |
| flake.nix XDG_DATA_DIRS fix included | Good practice for dev; prevents other potential GTK issues in dev environment |
| `read_file_bytes` Rust command | Read selected file in Rust → return bytes to JS; consistent with existing `decode_gif_bytes` pattern |

## Issues Encountered

| Issue | Resolution |
|---|---|
| Previous plan replaced plugin-dialog with HTML input — same crash | Root cause is WebKitGTK's built-in file dialog, not the Tauri plugin |
| NixOS doesn't expose Nix-store schemas via XDG_DATA_DIRS by default | Must set XDG_DATA_DIRS in flake shellHook |
| wry doesn't intercept run-file-chooser signal | Can only work around at GTK env level (GSETTINGS_BACKEND) or avoid triggering it |

## Resources

- WebKitGTK `run-file-chooser` signal: https://webkitgtk.org/reference/webkit2gtk/stable/signal.WebView.run-file-chooser.html
- Mozilla GSettings memory backend: https://bugzilla.mozilla.org/show_bug.cgi?id=797535
- NixOS Tauri wiki: https://wiki.nixos.org/wiki/Tauri
- tauri-docs NixOS issue #1560: https://github.com/tauri-apps/tauri-docs/issues/1560
- NixOS Discourse Hyprland file picker: https://discourse.nixos.org/t/hyprland-file-picker-not-working/69420
- Tauri file system plugin docs: https://v2.tauri.app/plugin/file-system/
