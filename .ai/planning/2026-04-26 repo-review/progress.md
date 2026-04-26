# Progress Log

## Session: 2026-04-26

### Phase 1: Completed review discovery and triage

- **Status:** Complete
- **Started:** 2026-04-26 08:12 UTC
- Actions taken:
  - Read planning templates and created the review planning folder
  - Inspected repository structure, large files, and dependency manifests
  - Spawned frontend/backend sub-agents and consolidated their findings
  - Recorded review evidence and structural risks in `findings.md`
- Files created/modified:
  - `.ai/planning/2026-04-26 repo-review/findings.md` (created)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (created)
  - `.ai/planning/2026-04-26 repo-review/questions.md` (created)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (created)

### Phase 2: Completed validation and review delivery

- **Status:** Complete
- Actions taken:
  - Ran `pnpm check`, `pnpm build`, `pnpm test:unit`, `pnpm tauri build`, `pnpm test:e2e`, and `cargo test`
  - Delivered the structured frontend/backend review to the user
  - Restructured `plan.md` so completed work is collapsed into 2 phases and future work is split into narrow execution phases
- Files created/modified:
  - `.ai/planning/2026-04-26 repo-review/findings.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (updated)

### Phase 3: Frontend toolbar decomposition

- **Status:** Complete
- Actions taken:
  - Ran the `domain-model` skill and established `context.md` (Project, Frame, Project States, Open, Export, Close, Cancel, Playback, Window Controls, Project Lifecycle)
  - Ran the `tdd` skill; implemented extractions with tracer bullet then incremental RED→GREEN cycles
  - Created `src/lib/components/WindowControls.svelte` (minimise/maximise/close OS window buttons)
  - Created `src/lib/components/WindowControls.test.ts` (1 behaviour test)
  - Created `src/lib/projectLifecycle.ts` (open/export/cancel orchestration with injected dependencies)
  - Created `src/lib/projectLifecycle.test.ts` (7 behaviour tests replacing 5 fragile source-text assertions)
  - Updated `Toolbar.svelte`: replaced inline window buttons with `<WindowControls />`, replaced `handleOpen`/`handleExport`/`handleCancelLoad` inline functions with `createProjectLifecycle` factory
  - Removed 5 source-text assertions from `Toolbar.test.ts` (fragile pattern checks now covered by behaviour tests in `projectLifecycle.test.ts`)
  - Confirmed 0 svelte-check errors/warnings after all changes
- Files created/modified:
  - `context.md` (created)
  - `src/lib/components/WindowControls.svelte` (created)
  - `src/lib/components/WindowControls.test.ts` (created)
  - `src/lib/projectLifecycle.ts` (created)
  - `src/lib/projectLifecycle.test.ts` (created)
  - `src/lib/components/Toolbar.svelte` (updated — reduced from 747 to ~420 lines)
  - `src/lib/components/Toolbar.test.ts` (updated — 5 source-text tests removed)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)

### Phase 4: Frontend frame store decomposition

- **Status:** Complete
- Actions taken:
  - Ran domain-model skill; added **Selection** and **Frame Editing** terms to `context.md`
  - Confirmed no new domain term needed for loading state (covered by existing Loading Project State + Cancel)
  - Created `src/lib/frameSelection.ts` — pure functions for all 11 selection operations
  - Created `src/lib/frameEditing.ts` — pure functions for all 13 frame editing operations
  - Updated `src/lib/stores/frames.svelte.ts` — now a thin reactive store (~200 lines) delegating to the two helpers; public API unchanged
  - Confirmed 0 svelte-check errors/warnings after all changes
- Files created/modified:
  - `context.md` (updated — Selection and Frame Editing terms added)
  - `src/lib/frameSelection.ts` (created)
  - `src/lib/frameEditing.ts` (created)
  - `src/lib/stores/frames.svelte.ts` (updated — reduced from 584 to ~200 lines)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)

### Phase 5: Frontend GIF open/decode flow consolidation

- **Status:** Complete
- Actions taken:
  - Ran `domain-model`; resolved drag-drop import as the same **Open** action as toolbar Open, while preserving the existing feedback surfaces
  - Updated `context.md` to record the resolved ambiguity around **Open**
  - Ran `tdd`; introduced `src/lib/projectOpen.ts` as the shared Open-from-path lifecycle and `src/lib/tauriGifBackend.ts` as the shared Tauri decode/export backend
  - Updated `src/lib/projectLifecycle.ts` and `Toolbar.svelte` so toolbar Open/Cancel use the shared backend cancellation state instead of a toolbar-local `decodeId`
  - Updated `src/routes/+page.svelte` so drag-drop now uses the same shared Open lifecycle while keeping inline drop errors
  - Replaced brittle `handleDrop` source-text checks in `src/routes/page.test.ts` with behaviour tests in `src/lib/projectOpen.test.ts`
  - Confirmed 0 svelte-check errors/warnings after all changes
- Files created/modified:
  - `context.md` (updated — Open ambiguity resolved)
  - `src/lib/actions.ts` (updated — shared `decodeGifPathStreaming`)
  - `src/lib/projectOpen.ts` (created)
  - `src/lib/projectOpen.test.ts` (created)
  - `src/lib/tauriGifBackend.ts` (created)
  - `src/lib/projectLifecycle.ts` (updated)
  - `src/lib/projectLifecycle.test.ts` (updated)
  - `src/lib/components/Toolbar.svelte` (updated)
  - `src/routes/+page.svelte` (updated)
  - `src/routes/page.test.ts` (updated — shared-flow wiring checks replace brittle decode regex checks)
  - `.ai/planning/2026-04-26 repo-review/findings.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (updated)

### Phase 6: Frontend interaction plumbing cleanup

- **Status:** Complete
- Actions taken:
  - Ran the `domain-model` skill and resolved **Canvas** as the canonical preview-surface term plus **Keyboard Binding** as app-wide by default, with contextual `Enter`/`Escape`
  - Ran the `tdd` skill; added `src/lib/keyboardPolicy.ts` and `src/lib/keyboardPolicy.test.ts` so shortcut policy is explicit and shared across page, toolbar, and timeline listeners
  - Added `src/lib/inspectorLayout.ts` and `src/lib/inspectorLayout.test.ts`; `+page.svelte` now derives visible canvas width from the inspector layout contract instead of querying `[data-testid="inspector"]`
  - Updated `Timeline.svelte` so drag geometry uses `data-frame-id` rather than test ids at runtime
  - Renamed the preview-surface code to match the resolved domain term: `FrameViewer` → `Canvas`, `viewer-fit` → `canvas-fit`, related page state names, and studio E2E selectors
  - Updated `HelpMenu.svelte`, `NotificationDialog.svelte`, and `FilePicker.svelte` to remove ignored click-event warnings; file-picker entries now support keyboard activation
  - Added/updated focused tests in `FilePicker.test.ts`, `HelpMenu.test.ts`, `NotificationDialog.test.ts`, and `Timeline.test.ts`
  - Rebuilt the desktop app and reran the studio E2E spec after the canvas selector rename to confirm the desktop path still works
  - Confirmed 0 svelte-check errors/warnings after all changes
- Files created/modified:
  - `context.md` (updated — Canvas and Keyboard Binding terms added)
  - `src/lib/canvas-fit.ts` (renamed from `viewer-fit.ts`)
  - `src/lib/canvas-fit.test.ts` (renamed from `viewer-fit.test.ts`)
  - `src/lib/keyboardPolicy.ts` (created)
  - `src/lib/keyboardPolicy.test.ts` (created)
  - `src/lib/inspectorLayout.ts` (created)
  - `src/lib/inspectorLayout.test.ts` (created)
  - `src/routes/+page.svelte` (updated)
  - `src/lib/components/Toolbar.svelte` (updated)
  - `src/lib/components/Canvas.svelte` (renamed from `FrameViewer.svelte`)
  - `src/lib/components/Canvas.test.ts` (renamed from `FrameViewer.test.ts`)
  - `src/lib/components/Inspector.svelte` (updated)
  - `src/lib/components/Timeline.svelte` (updated)
  - `src/lib/components/Timeline.test.ts` (updated)
  - `src/lib/components/FilePicker.svelte` (updated)
  - `src/lib/components/FilePicker.test.ts` (created)
  - `src/lib/components/HelpMenu.svelte` (updated)
  - `src/lib/components/HelpMenu.test.ts` (updated)
  - `src/lib/components/NotificationDialog.svelte` (updated)
  - `src/lib/components/NotificationDialog.test.ts` (updated)
  - `tests/e2e/specs/studio.ts` (updated — canvas selector rename)
  - `.ai/planning/2026-04-26 repo-review/findings.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (updated)

### Phase 7: Frontend rendering utility extraction

- **Status:** Complete
- Actions taken:
  - Read domain-model skill and assessed `context.md` — no new domain terms needed (rendering is an implementation utility, not a domain concept)
  - Confirmed the RGBA-to-canvas logic in `Canvas.svelte` (lines 47–58) and `Timeline.svelte` (`renderRgba`, lines 6–17) is functionally identical
  - Applied TDD: wrote `src/lib/frameRenderer.test.ts` (5 tests, RED), created `src/lib/frameRenderer.ts` with `renderFrameToCanvas` (GREEN)
  - Updated `Canvas.svelte` to call `renderFrameToCanvas` in the `$effect`, replacing 10 lines of inline logic
  - Updated `Timeline.svelte` to delegate `renderRgba` to `renderFrameToCanvas`, keeping the `drawRgba` action wrapper intact
  - Confirmed 0 svelte-check errors/warnings; all 358 unit tests pass
- Files created/modified:
  - `src/lib/frameRenderer.ts` (created)
  - `src/lib/frameRenderer.test.ts` (created — 5 behaviour tests)
  - `src/lib/components/Canvas.svelte` (updated — inline rendering replaced with `renderFrameToCanvas` call)
  - `src/lib/components/Timeline.svelte` (updated — `renderRgba` body delegates to `renderFrameToCanvas`)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)

### Phase 8: Frontend E2E suite decomposition and determinism

- **Status:** Complete
- Actions taken:
  - Read `domain-model` skill and confirmed no new domain terms needed; dropped "Phase 6" label from inspector describe name
  - Created `tests/e2e/helpers.ts` — all shared helpers extracted from studio.ts plus new `resetToEmpty()`, `waitForFrameCount()`, `getLoadedGifFitMetrics()`, `waitForZoomReset()`, `getEmptyViewerAlignment()`, `getToolbarPlaybackAlignment()`
  - Split studio.ts (1881 lines) into 7 focused spec files: `app-launch.ts`, `open-close.ts`, `playback.ts`, `frame-editing.ts`, `keyboard.ts`, `canvas.ts`, `inspector.ts`
  - Each spec file has `before()` hooks using `loadFixture()` for independent state setup
  - Fixed inspector.ts frame-count assertions to match 3-frame fixture (`FRAME 1 / 3`, `FRAMES 1-2 / 3`, `toHaveLength(4)` after duplicate, `frame-thumb-3` + `toHaveLength(3)` after delete)
  - Added `before()` to keyboard.ts to load a fixture so first test can close the project
  - Updated `wdio.conf.ts` to list all 8 spec files (splashscreen first)
  - Deleted `tests/e2e/specs/studio.ts`
  - All 8 spec files pass: 103 total tests in 1:45
- Files created/modified:
  - `tests/e2e/helpers.ts` (created)
  - `tests/e2e/specs/app-launch.ts` (created)
  - `tests/e2e/specs/open-close.ts` (created)
  - `tests/e2e/specs/playback.ts` (created)
  - `tests/e2e/specs/frame-editing.ts` (created)
  - `tests/e2e/specs/keyboard.ts` (created)
  - `tests/e2e/specs/canvas.ts` (created)
  - `tests/e2e/specs/inspector.ts` (created)
  - `tests/e2e/wdio.conf.ts` (updated — 8 spec files replacing studio.ts)
  - `tests/e2e/specs/studio.ts` (deleted)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)

### Phase 9: Frontend store test-file decomposition

- **Status:** Complete
- Actions taken:
  - Ran `domain-model`; confirmed no new glossary term or ADR was needed because the existing terms already map cleanly to the desired split (`Selection`, `Playback`, `Project State` for loading, `Frame Editing`)
  - Narrowed the phase with the user: split the giant frame-store test only; defer SSR-vs-DOM strategy work and other brittle-test cleanup
  - Ran `tdd` and replaced `src/lib/stores/frames.test.ts` with smaller focused files aligned to the current store structure
  - Added `src/lib/stores/frameStore.test-support.ts` for shared frame fixtures and reset setup
  - Split the coverage into `frames.store.test.ts`, `frames.playback.test.ts`, `frames.loading.test.ts`, `frames.selection.test.ts`, `frames.editing.deletion.test.ts`, `frames.editing.deduplication.test.ts`, `frames.editing.movement.test.ts`, `frames.editing.duration.test.ts`, and `frames.editing.duplication.test.ts`
- Files created/modified:
  - `src/lib/stores/frameStore.test-support.ts` (created)
  - `src/lib/stores/frames.store.test.ts` (created)
  - `src/lib/stores/frames.playback.test.ts` (created)
  - `src/lib/stores/frames.loading.test.ts` (created)
  - `src/lib/stores/frames.selection.test.ts` (created)
  - `src/lib/stores/frames.editing.deletion.test.ts` (created)
  - `src/lib/stores/frames.editing.deduplication.test.ts` (created)
  - `src/lib/stores/frames.editing.movement.test.ts` (created)
  - `src/lib/stores/frames.editing.duration.test.ts` (created)
  - `src/lib/stores/frames.editing.duplication.test.ts` (created)
  - `src/lib/stores/frames.test.ts` (deleted)
  - `.ai/planning/2026-04-26 repo-review/findings.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (updated)

### Phase 10: Frontend TypeScript and dependency hygiene

- **Status:** Complete
- Actions taken:
  - Ran `domain-model`; confirmed no new glossary term or ADR was needed because this phase is implementation hygiene, not a domain change
  - Narrowed the phase with the user: `tests/e2e/tsconfig.json` is now the single source of truth for E2E typing
  - Ran `tdd`; inspected ambient-type usage and confirmed non-E2E tests already import `vitest`, while E2E types were only needed under `tests/e2e/`
  - Removed `@wdio/globals/types` and `mocha` from the root `tsconfig.json`
  - Discovered that root `pnpm check` still included `tests/e2e/**` via inherited `.svelte-kit/tsconfig.json` includes, then fixed the leakage by explicitly excluding `tests/e2e/**` in the root config
  - Removed the per-file `/// <reference types="mocha" />` directives from the E2E specs and removed `@types/mocha` from `package.json`
  - Updated `pnpm-lock.yaml` via `pnpm install`
- Files created/modified:
  - `tsconfig.json` (updated — root types narrowed to app-only and `tests/e2e/**` excluded)
  - `package.json` (updated — removed `@types/mocha`)
  - `pnpm-lock.yaml` (updated)
  - `tests/e2e/specs/app-launch.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/open-close.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/playback.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/frame-editing.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/keyboard.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/canvas.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/inspector.ts` (updated — removed per-file Mocha reference)
  - `tests/e2e/specs/splashscreen.ts` (updated — removed per-file Mocha reference)
  - `.ai/planning/2026-04-26 repo-review/findings.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (updated)

### Phase 11: Cross-cutting repo artefact hygiene

- **Status:** Complete
- Actions taken:
  - Ran `domain-model`; confirmed no new glossary term or ADR was needed because this phase is repo hygiene rather than product language
  - Narrowed the phase with the user: treat `src-tauri/.svelte-kit/` as generated spillover and delete the stale root `index.html`
  - Ran `tdd`; confirmed the observable contract is repo cleanup plus green existing tooling, with `pnpm check` and `pnpm build` as the relevant validation
  - Updated `src-tauri/.gitignore` so `src-tauri/.svelte-kit/` is ignored going forward
  - Deleted the tracked generated files under `src-tauri/.svelte-kit/`
  - Deleted the stale root `index.html` Leptos/Trunk scaffold
- Files created/modified:
  - `src-tauri/.gitignore` (updated — ignore `/.svelte-kit/`)
  - `index.html` (deleted — stale Leptos/Trunk scaffold)
  - `src-tauri/.svelte-kit/ambient.d.ts` (deleted)
  - `src-tauri/.svelte-kit/generated/client/app.js` (deleted)
  - `src-tauri/.svelte-kit/generated/client/matchers.js` (deleted)
  - `src-tauri/.svelte-kit/generated/client/nodes/0.js` (deleted)
  - `src-tauri/.svelte-kit/generated/client/nodes/1.js` (deleted)
  - `src-tauri/.svelte-kit/tsconfig.json` (deleted)
  - `.ai/planning/2026-04-26 repo-review/findings.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/plan.md` (updated)
  - `.ai/planning/2026-04-26 repo-review/progress.md` (updated)

## Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |
| Frontend checks | `pnpm check` | Pass without diagnostics | Passed, 0 errors and 0 warnings (Phase 11) | ✓ |
| Frontend build | `pnpm build` | Production build succeeds | Passed (Phase 11) | ✓ |
| Unit tests | `pnpm test:unit` | All unit tests pass | Passed, 28 files / 358 tests (Phase 10) | ✓ |
| Tauri build | `pnpm tauri build` | Built app for E2E and packaging succeeds | Passed (Phase 10) | ✓ |
| Rust tests | `cd src-tauri && cargo test` | All Rust tests pass | Passed, 28 tests; 2 ignored | ✓ |
| E2E tests | `pnpm test:e2e` | All E2E specs pass | Passed, 8 spec files / 103 tests (Phase 10) | ✓ |

---

_Update after completing each phase_
