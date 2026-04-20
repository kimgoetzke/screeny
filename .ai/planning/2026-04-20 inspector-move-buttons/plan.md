# Task Plan: Inspector Move Frame Buttons

## Goal

Add 4 move-frame buttons to the inspector panel (move-to-start, step-left, step-right, move-to-end), displayed in a single row above the duplicate/delete row, with both rows pushed to the bottom of the panel.

## Current Phase

Phase 1

## Phases

### Phase 1: Store methods (TDD)

Use the `tdd` skill to write failing unit tests for the 4 new store methods, then implement each method.

- [ ] Write failing tests in `frames.test.ts` for:
  - `moveSelectedFramesToStart()` — moves selection to index 0
  - `moveSelectedFrameLeft()` — moves selection one position left; no-op at index 0
  - `moveSelectedFrameRight()` — moves selection one position right; no-op at last index
  - `moveSelectedFramesToEnd()` — moves selection to end of array
- [ ] Run tests → confirm they fail (red)
- [ ] Implement the 4 methods in `frames.svelte.ts` using `moveFramesToInsertionPoint` as the building block
- [ ] Run tests → confirm they pass (green)
- [ ] Check `pnpm check` for TypeScript/Svelte warnings; address any found
- [ ] Update `findings.md` and `progress.md`
- **Status:** pending

### Phase 2: UI — Inspector component

Use the `tdd` skill to add failing SSR unit tests for the new buttons, then update `Inspector.svelte`.

- [ ] Write failing tests in `Inspector.test.ts` for:
  - New move buttons container (`inspector-move-buttons`) renders when a frame is selected
  - Each of the 4 buttons renders (`inspector-btn-move-start`, `inspector-btn-move-left`, `inspector-btn-move-right`, `inspector-btn-move-end`)
  - Buttons do NOT render when no frame is selected
- [ ] Run tests → confirm they fail (red)
- [ ] Update `Inspector.svelte`:
  - Add move-buttons row (4 icon buttons) above action-buttons row
  - Wrap both rows in a `bottom-actions` container
  - Apply `margin-top: auto` to `bottom-actions` to push it to the bottom
  - Wire each button to the corresponding store method
  - Use SVG transport icons (skip-to-start, step-left, step-right, skip-to-end)
- [ ] Run unit tests → confirm they pass (green)
- [ ] Check `pnpm check` for warnings; address any found
- [ ] Update `progress.md`
- **Status:** pending

### Phase 3: E2E tests

Add E2E tests in a new describe block in `studio.ts`.

- [ ] Add `describe("Studio — inspector move-frame buttons", ...)`:
  - Setup: load test.gif fixture (3 frames), ensure frame 0 is selected
  - `move-to-end` button moves frame 0 to position 2 (last)
  - `move-to-start` button moves frame back to position 0
  - `step-right` button moves frame from position 0 to position 1
  - `step-left` button moves frame back to position 0
  - Multi-select: select frames 0–1, move-to-end puts them at positions 1–2
- [ ] Run E2E suite (requires built app) or note that E2E tests require `pnpm tauri build` first
- [ ] Update `progress.md`
- **Status:** pending

### Phase 4: Full regression run

- [ ] Run `pnpm test:unit` — all unit tests pass
- [ ] Run Rust tests: `cargo test` inside `src-tauri/`
- [ ] Run `pnpm test:e2e` (requires built app and tauri-driver)
- [ ] Fix any regressions
- [ ] Run `pnpm check` — no new warnings
- [ ] Update `progress.md` with test results
- **Status:** pending

### Phase 5: Finalise planning docs

- [ ] Update `plan.md` — all phases marked complete
- [ ] Update `findings.md` with any discoveries made during implementation
- [ ] Update `progress.md` with final test results
- **Status:** pending

## Key Questions

1. Should move buttons be disabled (visually) when at the edge (e.g. step-left disabled when frame is already first)? — Treat as no-op for now; disabled state is a UX enhancement that can be added later.
2. Should the move buttons appear only for single selections, or also for multi-selections? — Per requirements they work for both single and multi-select (same as duplicate/delete).

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Build on `moveFramesToInsertionPoint` | Already handles selection-adjusted insertion |
| `margin-top: auto` on `bottom-actions` wrapper | Pushes both button rows to bottom of flex column |
| No disabled state on edge buttons | Simplicity; no-op is safe and sufficient for now |
| TDD for every code change | As required by the task specification |
| Use `tdd` skill | Explicitly required |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes

- Follow `planning` skill conventions: update planning files after each phase
- Follow `tdd` skill: red → green → refactor
- Skills to use: `tdd` for all code, check for Svelte 5 / TypeScript warnings after each phase
- E2E tests depend on a built Tauri app — if the build is stale, `pnpm tauri build` must be run first
