# Progress Log

## Session 1 — 2026-04-14

### Actions taken
- Investigated root cause of `GLib-GIO-ERROR: No GSettings schemas` crash after previous plan failed
- Confirmed: crash is caused by WebKitGTK's default `run-file-chooser` handler, which opens `GtkFileChooserDialog` — not by `tauri-plugin-dialog`
- Replacing `<input type="file">` with HTML input did NOT fix the crash — it moved the GTK call from Rust to WebKitGTK's C code
- Researched all viable options (GSETTINGS_BACKEND=memory, tauri-plugin-dialog xdg-portal, custom file browser)
- User selected Option B: custom Svelte file browser backed by Rust `list_dir` command
- Created plan, findings, progress, questions documents

### Test results
- No code changes yet

### Decisions
- Option B selected: custom file browser eliminates `<input type="file">` → WebKitGTK's `run-file-chooser` never triggered → no GSettings lookup → no crash
- Plan is multi-phase (>5 files, ~200+ lines estimated)

### Next step
- Phase 2: implement Rust backend (`list_dir`, `read_file_bytes` commands)

## Session 2 — 2026-04-14

### Actions taken
- Phase 2: Added `DirEntry`, `list_dir`, `read_file_bytes`, `home_dir` to `lib.rs`; `e2e_fixture_dir` to `e2e.rs`; `gsettings-desktop-schemas` + `XDG_DATA_DIRS` to `flake.nix`
- Phase 3: Created `FilePicker.svelte` — modal, path input, up button, entry list (dirs + gifs), confirm/cancel; full data-testid coverage
- Phase 4: Updated `Toolbar.svelte` — removed `<input type="file">`, wired FilePicker; `getDialog()` always uses native open, only bypasses save in E2E
- Phase 5: Added `tauriInvoke` helper to `studio.ts`; rewrote open test to exercise real file picker path; removed `e2eDialog.openFile` bypass

### Test results
- `cargo test`: 17/17 pass (5 new tests for list_dir/read_file_bytes)
- `pnpm test:unit`: 35/35 pass

### Issues and fixes
- First E2E run: `navigateInput.setValue()` failed with "element did not become interactable" — WebdriverIO's interactability check fails for inputs inside a modal overlay
- Fix: replaced `setValue` + `browser.keys("Return")` with a `jsSetValue` helper (sets value + dispatches `input` event via JS) + `jsClick('[data-testid="file-picker-go"]')`. Also added `data-testid="file-picker-go"` to the Go button in FilePicker.svelte.

### Final test results
- `cargo test`: 17/17 pass
- `pnpm test:unit`: 35/35 pass
- `pnpm tauri build`: clean
- `pnpm test:e2e`: 13/13 studio tests pass ✅ (splashscreen spec has pre-existing failure unrelated to this change)

### Status: Complete
