# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Save dialog approach

The Open dialog can be cleanly solved with an HTML `<input type="file">`. However, the Export/Save dialog (choosing where to save the exported GIF) still needs a native save dialog or an alternative.

Three options:

**A) rfd + xdg-portal feature**
Use `rfd = { version = "0.15", features = ["xdg-portal"] }` in Cargo.toml and a Tauri command `save_file_dialog()`. Requires `xdg-desktop-portal-gtk` (or `-kde`) to be installed for the FileChooser interface. Do you have this installed? (`ls /usr/lib/xdg-desktop-portal-*` or `paru -Q xdg-desktop-portal-gtk`)

**B) Custom path input in Svelte**
Show a simple text field where the user types a save path (defaulting to `~/export.gif`). Zero system dependencies, works everywhere. Less polished but totally reliable.

**C) Auto-save to a fixed location**
Always save to e.g. `~/Downloads/screeny-export.gif` (with a timestamp) and show the path in the status bar. No dialog needed.

Which do you prefer? And do you have `xdg-desktop-portal-gtk` installed (to know whether Option A is viable)?

### Response

I think you approaching the problem incorrectly if you're asking my if _I_ have a certain dependency installed. The goal here is to build an app that works for _every_ user who uses Hyprland on Wayland. Please create a plan that accommodates this critical requirement.
<!-- Processed -->

## Q2: Decode by path vs. bytes

Currently `decode_gif` is a Rust command that takes a file **path** (`String`). If we use an HTML input, the safest approach is to read the file as bytes in JavaScript and pass them to Rust (changing the command signature to `Vec<u8>`).

The alternative is to rely on Tauri 2's `file.path` property on `File` objects — this keeps the path-based API but depends on Tauri patching the webview's File API (which it does, but it's undocumented).

Prefer **bytes** (safer, no Tauri internals) or **path** (keep existing API, rely on Tauri File.path)?

### Response

I don't understand the difference here and what the pros and cons are.
<!-- Processed -->
