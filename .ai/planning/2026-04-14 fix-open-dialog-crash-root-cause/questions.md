# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Approach choice

Two viable options were identified. Which do you prefer?

**Option A — GSETTINGS_BACKEND=memory (quick, 2 files, ~5 lines)**
Set an environment variable in `main.rs` before Tauri/GTK initialises. GIO uses volatile in-memory settings → no schema lookup → no crash. The GTK file chooser dialog still appears and works; it just won't remember the last-visited directory between app sessions. Also fix `flake.nix` so the NixOS dev environment finds schemas via `XDG_DATA_DIRS` (belt-and-braces).

Pros: minimal change, low risk, universal fix, works immediately.
Cons: file dialog does not persist preferences across sessions (minor UX trade-off).

**Option B — Custom Svelte file browser (robust, ~200+ lines)**
Remove `<input type="file">` entirely. Add a Rust `list_dir` command and a custom Svelte file picker modal. No `<input type="file">` → WebKitGTK's `run-file-chooser` is never triggered → zero GTK involvement.

Pros: truly zero GTK, fully self-contained, best long-term solution.
Cons: significantly more UI work to build a usable file browser.

My recommendation is **Option A now** — it fixes the crash for all users immediately — and we track Option B as a future improvement.

### Response

Let's do option B now.
<!-- Processed -->
