# Task Plan: Toolbar polish

## Goal

Determine whether Screeny can merge its toolbar with window controls on Linux/Wayland, plan the help menu/key bindings surface, and deliver the requested toolbar-centering change with TDD and full regression coverage.

## Current Phase

Phase 5

## Phases

### Phase 1: Requirements & Discovery

- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in `findings.md` in line with the `planning` skill
- [x] Research Tauri 2 title-bar support, including Linux/Wayland constraints
- [x] Identify likely files, tests, and permissions involved
- **Status:** complete

### Phase 2: Scope confirmation for title-bar merge

- [x] Confirm whether a Linux/Wayland **custom client-side title bar** counts as the desired merge, given native compositor buttons cannot be retained in the same strip
- [x] Record the user response in `questions.md`
- [x] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill after the decision
- **Status:** complete

### Phase 3: Toolbar/help-menu design plan

- [x] If Phase 2 is approved, define the merged title-bar structure in the existing toolbar component tree
- [x] Plan help-button placement at the top-right, with the button immediately left of window controls when custom controls exist
- [x] Plan how to source and display the app version
- [x] Finalise the key bindings inventory grouped by context
- [x] Explicitly note that implementation must use the `tdd` skill and update all planning files in line with the `planning` skill
- **Status:** complete

### Phase 4: Playback-controls centring implementation

- [x] Use the `tdd` skill before code changes
- [x] Add or update focused tests first for the toolbar layout/markup
- [x] Implement horizontally centred playback controls without regressing existing toolbar states
- [x] Address warnings found during implementation where best-practice fixes are appropriate
- [x] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill
- **Status:** complete

### Phase 5: Full verification and delivery

- [x] Run `pnpm check`
- [x] Run `pnpm test:unit`
- [x] Run `pnpm test:e2e`
- [x] Run `cargo test` from `src-tauri`
- [x] Record results and any errors in `progress.md`
- [x] Ensure all planning files stay up to date in line with the `planning` skill
- **Status:** complete

## Key Questions

1. Does “merge the header bar with the tool bar” mean a **custom client-side title bar** on Linux/Wayland is acceptable, even though native compositor-provided caption buttons cannot remain native in the same strip?
2. If the answer is no, the title-bar merge work will be dropped and only the help-menu planning plus playback-centering implementation remain.

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Use the existing `Toolbar.svelte` as the primary integration point | The app already renders one top bar there, so merge/help work should stay local rather than introducing a second top-level bar. |
| Treat native-button retention on Linux/Wayland as unsupported | Official Tauri docs support custom client-side title bars; no Linux-native embedded-content title bar API was found. |
| Reserve `tdd` as mandatory for implementation phases | The user explicitly required it, and the `planning` skill requires TDD-oriented work. |
| Use a toolbar with left / centre / right regions | Supports the implemented playback-centering fix and is the right base for later help/menu/window-control work. |
| Add the help overlay in `Toolbar.svelte` using conditional rendering | Matches the repo’s existing modal/dialog pattern and keeps ownership local to the toolbar. |
| Put draggable title-bar space on non-interactive toolbar regions only | Avoids drag-region interference with buttons and menus. |
| Retrieve version from `@tauri-apps/api/app` `getVersion()` | Keeps help-menu version display authoritative. |
| Open the GitHub URL via `@tauri-apps/plugin-opener` `openUrl()` | Uses the existing plugin and default-browser behaviour. |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| `cargo test` from repo root failed because `Cargo.toml` is under `src-tauri` | 1 | Re-ran from `src-tauri`, which passed. |

## Planned toolbar/help-menu work

1. **Merged title bar:** set `decorations: false` on the main window, add required `core:window:*` permissions, and render minimise / maximise / close in the toolbar’s right region.
2. **Toolbar structure:** keep primary file actions left, playback controls centred, and reserve the right region for help plus window controls.
3. **Help entry point:** add a question-mark icon button at the top right; when merged title-bar controls exist, place the help button immediately to their left.
4. **Help overlay:** render as a conditional toolbar-owned overlay/dialog, consistent with `FilePicker.svelte` and `NotificationDialog.svelte`.
5. **Help content:** show current app version via `getVersion()`, a GitHub action using `openUrl("https://github.com/kimgoetzke/screeny")`, and the key bindings table captured in `findings.md`.
6. **Window drag behaviour:** mark only the non-interactive title-bar stretch as draggable; leave all controls outside drag regions.

## Notes

- Re-read this plan before major decisions.
- If Phase 2 is rejected, remove title-bar merge implementation from later phases and keep the plan focused on help menu + playback centring.
- Likely file set for approved merge/help work: `src/lib/components/Toolbar.svelte`, new/related component tests, `src/routes/+page.svelte`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, and possibly Rust window setup if config alone is insufficient.
