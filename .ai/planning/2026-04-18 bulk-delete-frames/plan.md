# Task Plan: Bulk Delete Frames

## Goal

Add shift-click multi-selection to the timeline and implement bulk frame deletion with clear visual feedback that all selected frames will be affected.

## Current Phase

Phase 3 (complete)

## Phases

### Phase 1: Store — multi-select state & bulk delete (TDD)

- [x] Write failing unit tests for `selectedFrameIds`, `shiftSelectFrames`, `deleteSelectedFrames`, and updated `selectFrame` behaviour in `frames.test.ts`
- [x] Implement in `frames.svelte.ts`:
  - `selectedFrameIds: Set<string>` state (private)
  - `get selectedFrameIds(): ReadonlySet<string>` — public getter
  - `selectFrame(id)` — selects single frame, resets `selectedFrameIds` to `{id}`
  - `shiftSelectFrames(id)` — selects range from `selectedFrameId` to `id` (inclusive, both directions); if `id === selectedFrameId`, collapses to single selection
  - `deleteSelectedFrames()` — deletes all frames in `selectedFrameIds`, updates `selectedFrameId` to nearest remaining frame
  - `setFrames()`, `clear()`, `startLoading()` — reset `selectedFrameIds` appropriately
  - `deleteFrame()` — removes deleted frame from `selectedFrameIds` if present
- [x] Run `pnpm test:unit` — all 94 tests pass

- **Status:** complete

### Phase 2: Timeline component — shift-click & bulk-delete UX (TDD)

- [x] Write failing tests in `Timeline.test.ts` for:
  - Range selection: all frames in range get `selected` class in SSR render
  - Single selection: only correct frame gets `selected` class
  - Count badge: rendered on all selected frames when >1 selected, with correct count
  - Count badge: not rendered for single selection
  - CSS rule: `:has(.frame-thumb.selected .delete-btn:hover)` shows delete on all selected
  - CSS rule: danger style applied to all selected delete buttons on hover
  - CSS rule: red tint `::after` overlay on all selected frames on delete hover
- [x] Update `Timeline.svelte`:
  - `onclick` handler checks `event.shiftKey` → `shiftSelectFrames` vs `selectFrame`
  - `selected` class driven by `frameStore.selectedFrameIds.has(frame.id)`
  - Count badge `<span data-testid="delete-count-{index}">` on selected frame delete buttons when `selectionCount > 1`
  - Delete button calls `frameStore.deleteSelectedFrames()`
  - Pure CSS `:has()` approach for bulk hover effects and red tint (no JS state needed)
- [x] Run `pnpm test:unit` — all 102 tests pass

- **Status:** complete

### Phase 3: Wrap-up

- [x] Run full unit test suite `pnpm test:unit` — 102 passed
- [x] Final update of all planning files per `planning` skill

- **Status:** complete

## Key Questions

1. Which visual indicator for bulk delete scope? (see `questions.md` Q1 — awaiting user response before Phase 2)

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| `selectedFrameIds` as a `Set<string>` in store | Clean O(1) lookup; aligns with existing single-select pattern; testable in isolation |
| `shiftSelectFrames` on store, not component | Keeps range-select logic unit-testable without SSR component rendering |
| `deleteSelectedFrames` replaces per-frame `deleteFrame` in Timeline | Single call, single selection-adjustment calculation |
| CSS-based delete button visibility for all selected frames | Avoids per-frame JS hover tracking; one CSS rule driven by a Svelte class |
| Use `tdd` skill throughout | Project convention; required by CLAUDE.md |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions
- Log ALL errors — they help avoid repetition
- Follow `tdd` skill for all code changes
