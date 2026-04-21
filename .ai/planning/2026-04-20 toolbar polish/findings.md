# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: this work spans web/platform research, likely touches more than 5 files if the title bar merge and help menu proceed, requires more than 5 tool uses, and already includes a mandated TDD implementation plus full frontend, E2E, and Rust verification.

## Requirements

- Investigate whether the native window header controls can be merged into the app toolbar.
- Do web research for what Tauri 2 and the target platforms allow.
- If merge is not feasible, record that no work is needed for that part.
- If merge is feasible, produce a plan for it.
- Plan a help menu opened from a question-mark button at the top-right of the toolbar.
- If a merged title bar is feasible, keep minimise/maximise/close controls at the far right and place the help button immediately to their left.
- The help overlay must show the current app version, a GitHub help/issues action opening `https://github.com/kimgoetzke/screeny`, and a key bindings table with Context, Binding, and Action.
- Identify all currently configured key bindings to populate that table.
- Implement playback icon centring in the toolbar using the `tdd` skill.
- Check warnings and either fix them or explain why not.
- Run all unit, E2E, and Rust tests before finishing implementation work.

## Research Findings

- `Toolbar.svelte` is the only current top-bar component and already contains the open/export/play/stop controls plus status and save UI.
- The main app page mounts `Toolbar` directly at the top of the app layout in `src/routes/+page.svelte`.
- The main window currently uses default decorations: `src-tauri/tauri.conf.json` defines the `main` window without `decorations: false`.
- Rust currently disables window decorations only for the splash screen window in `src-tauri/src/lib.rs`.
- Tauri’s official window customisation guide documents the supported cross-platform route for a merged/custom title bar: set `decorations: false`, define draggable regions in web UI, and wire minimise/maximise/close with Tauri window APIs.
- The Tauri `TitleBarStyle` API that places content into native title-bar space is documented as macOS-only, not Linux/Wayland.
- For Linux/Wayland, there is no documented Tauri-native API to keep compositor-native caption buttons while also embedding custom web UI in the same header strip. The practical path is full client-side decorations.
- The repo’s current capability file only grants `core:default` and `opener:default`, so a merged custom title bar would likely need added window-control permissions such as minimise, toggle maximise, close, and start dragging.
- Existing keyboard handling is split across `+page.svelte` (global `Ctrl+I`), `Timeline.svelte` (timeline/global playback and selection keys), `Toolbar.svelte` (save input `Enter`/`Escape`), `FilePicker.svelte` (`Enter` in path field), `NotificationDialog.svelte` (`Escape`), and timeline frame thumbnails (`Enter`).
- The user approved the Linux/Wayland merge plan using custom client-side window controls instead of native compositor-provided buttons.
- Tauri’s app JS API exposes `getVersion()`, which is the cleanest source for the help menu’s app version.
- Tauri’s opener plugin docs expose `openUrl()` and note that the default opener permission already allows `http`/`https` URLs; the repo already enables `opener:default`.
- The playback-centering slice was implemented by splitting the toolbar into left/centre/right layout regions so the play/stop group remains pinned to the toolbar midpoint.
- Full validation completed after the change: `pnpm check`, full unit suite, full E2E suite, `pnpm tauri build`, and `cargo test`.

Key bindings inventory for the planned help menu:

| Context | Binding | Action |
| ------- | ------- | ------ |
| Global (while inspector visible) | `Ctrl+I` | Toggle inspector minimised state |
| Timeline | `Ctrl+A` | Select all frames |
| Timeline | `ArrowLeft` | Select previous frame |
| Timeline | `ArrowRight` | Select next frame |
| Timeline | `Shift+ArrowLeft` | Extend selection left |
| Timeline | `Shift+ArrowRight` | Extend selection right |
| Timeline | `Ctrl+ArrowLeft` | Select first frame |
| Timeline | `Ctrl+ArrowRight` | Select last frame |
| Timeline | `Ctrl+Shift+ArrowLeft` | Extend selection to first frame |
| Timeline | `Ctrl+Shift+ArrowRight` | Extend selection to last frame |
| Timeline | `Delete` | Delete selected frame(s) |
| Timeline | `Space` | Toggle playback |
| Timeline | `PageUp` | Scroll timeline left |
| Timeline | `PageDown` | Scroll timeline right |
| Timeline frame thumbnail | `Enter` | Select the focused frame |
| Save path input | `Enter` | Confirm save path |
| Save path input | `Escape` | Cancel save |
| File picker path input | `Enter` | Navigate to typed path |
| Confirmation dialog | `Escape` | Cancel / dismiss the dialog |

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Use `toolbar polish` as the task name | Short, descriptive, and fits the planning folder naming rule. |
| Treat this as a multi-phase plan | Discovery, web research, planning, and an implementation/testing slice are all in scope. |
| Treat title-bar merging as feasible only via custom client-side controls on Linux/Wayland | Official Tauri docs support custom title bars with `decorations: false`; no Linux-native mixed titlebar/content path is documented. |
| Source the help-menu version via `getVersion()` | Keeps the displayed version aligned with the packaged Tauri app version. |
| Open the GitHub help/issues link via `openUrl()` from the existing opener plugin | Matches the current dependency/plugin setup and uses the OS default browser. |
| Keep the help menu as a parent-rendered overlay, not a global portal/store | Matches the repo’s existing dialog pattern. |
| Use a three-region toolbar layout | Gives a stable centre lane for playback now and later accommodates right-side help/window controls. |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| None yet | N/A |

## Resources

- `src/lib/components/Toolbar.svelte`
- `src/routes/+page.svelte`
- `src/routes/+page.test.ts`
- `src/lib/components/Toolbar.test.ts`
- `src/lib/components/Timeline.svelte`
- `src/lib/components/FilePicker.svelte`
- `src/lib/components/NotificationDialog.svelte`
- `src-tauri/tauri.conf.json`
- `src-tauri/capabilities/default.json`
- `src-tauri/src/lib.rs`
- `package.json`
- Tauri JS window docs: https://v2.tauri.app/reference/javascript/api/namespacewindow/
- Tauri config docs: https://v2.tauri.app/reference/config/#windowconfig
- Tauri window customisation guide: https://v2.tauri.app/learn/window-customization/
- Tauri `TitleBarStyle` docs: https://docs.rs/tauri/latest/tauri/enum.TitleBarStyle.html
- Wayland xdg-decoration protocol: https://wayland.app/protocols/xdg-decoration-unstable-v1

## Visual/Browser Findings

- Tauri’s custom titlebar guide explicitly shows the supported pattern: disable decorations, mark drag regions in DOM, and call minimise/maximise/close from web UI.
- No Tauri doc found a Linux-specific equivalent of macOS title bar overlay/content embedding.
- The Wayland decoration model is compositor-dependent, which reinforces that keeping native Linux window-manager buttons while inserting app web content into the same strip is not a portable plan.
- Tauri’s app API docs explicitly expose `getVersion()` for the packaged app version.
- Tauri’s opener plugin docs explicitly expose `openUrl()` and document that `opener:default` allows opening `https://` URLs.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
