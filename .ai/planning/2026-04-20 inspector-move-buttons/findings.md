# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: 5 files will be modified (frames.svelte.ts, frames.test.ts, Inspector.svelte, Inspector.test.ts, studio.ts), 200+ lines of change expected, many tool uses required.

## Requirements

- Add 4 new buttons to the inspector in a single row:
  1. Move selected frame(s) to far left (start of array)
  2. Move selected frame(s) one position to the left
  3. Move selected frame(s) one position to the right
  4. Move selected frame(s) to far right (end of array)
- New button row must sit above the duplicate/delete row
- Both the new move row AND the existing duplicate/delete row must be moved to the **bottom** of the inspector panel body (pushed via flex layout)
- All 4 buttons use standard "skip/step" transport icons (skip-to-start, step-left, step-right, skip-to-end)
- Must use TDD (`tdd` skill)
- Must check for and address warnings
- Must include E2E tests
- Must run all tests (unit, E2E, Rust) for regression check

## Research Findings

### Existing store methods
- `moveFramesToInsertionPoint(insertionIndex)` — already exists; inserts selected frames at a given position in the original array. This is the building block for all 4 new store methods.
- Insertion index is in terms of the *original* array (before removing selected frames); the method adjusts for selected frames being above the insertion point.

### Move formulae (using `moveFramesToInsertionPoint`)
| Button | Logic |
|--------|-------|
| Move to start | `moveFramesToInsertionPoint(0)` |
| Move one left | `minIndex = first selected index; moveFramesToInsertionPoint(minIndex - 1)` — no-op if already 0 |
| Move one right | `maxIndex = last selected index; moveFramesToInsertionPoint(maxIndex + 2)` — no-op if already at end |
| Move to end | `moveFramesToInsertionPoint(frames.length)` |

### Current Inspector.svelte layout
Inspector body (`flex-direction: column; gap: 24px`) contains:
1. Frame indicator
2. Bulk-edit tag (conditional on `isMultiSelect`)
3. Duration row (conditional on `selectedFrameId`)
4. Dedup section (conditional on `isMultiSelect`)
5. Action buttons — duplicate + delete (conditional on `selectedFrameId`)

Target layout:
1. Frame indicator
2. Bulk-edit tag (conditional on `isMultiSelect`)
3. Duration row (conditional on `selectedFrameId`)
4. Dedup section (conditional on `isMultiSelect`)
5. `flex: 1` spacer to push button rows to bottom
6. Move buttons row — 4 buttons (conditional on `selectedFrameId`)
7. Action buttons row — duplicate + delete (conditional on `selectedFrameId`)

### Test patterns
- Unit tests: SSR via `render()` from `svelte/server`, assert on HTML string with `.toContain()`
- Store tests: direct function calls, assert on `frameStore.frames`/`selectedFrameIds`
- E2E: `jsClick(selector)` helper, `browser.pause()` for DOM settle, `$$('[data-testid^="frame-thumb-"]')` for frame count

### Existing `data-testid` values to know
- `inspector-btn-duplicate`, `inspector-btn-delete` — existing action button tests
- `inspector-actions` — container for duplicate/delete
- `frame-thumb-{index}`, `data-frame-id` attribute on thumbs

### SVG icons (standard transport icons)
- **Skip to start** (move to far left): vertical bar on left, chevron/arrow pointing left
- **Step left** (move one left): single left-pointing chevron/arrow
- **Step right** (move one right): single right-pointing chevron/arrow
- **Skip to end** (move to far right): vertical bar on right, chevron/arrow pointing right

### Warning considerations
- TypeScript: all new store methods must be fully typed
- Svelte 5: no `$:` reactive declarations — already using `$derived`; new code must follow same pattern
- `pnpm check` / `svelte-check` should show no new warnings

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Build on `moveFramesToInsertionPoint` | Already handles selection-adjusted insertion; avoids duplication |
| `margin-top: auto` on button container | Pushes both rows to bottom of flex column without adding extra DOM nodes |
| `data-testid="inspector-move-buttons"` | Consistent with existing `inspector-actions` testid |
| Individual testids for each button | `inspector-btn-move-start`, `inspector-btn-move-left`, `inspector-btn-move-right`, `inspector-btn-move-end` |
| Wrap both rows in a shared bottom container | Lets `margin-top: auto` push both rows as a unit |
| Assert E2E order via `data-frame-id` | More stable than relying on visual text or selection state alone |

## Implementation Findings

- The store changes stayed small because `moveFramesToInsertionPoint` already handled original-array insertion maths correctly.
- `selectedFrameId` and `selectedFrameIds` stay valid after these moves without extra selection-reset logic, so the buttons can rely on existing store behaviour.
- The inspector layout change only needed a shared `bottom-actions` wrapper; dedup controls remain above it and keep their existing conditional rendering.
- E2E coverage works well as a stateful sequence after reloading `test.gif`, matching the rest of `studio.ts`.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `cargo test` from repo root failed because `Cargo.toml` lives under `src-tauri/` | Run Rust tests from `src-tauri/` |

## Resources

- `src/lib/stores/frames.svelte.ts` — frame store
- `src/lib/stores/frames.test.ts` — store unit tests
- `src/lib/components/Inspector.svelte` — inspector component
- `src/lib/components/Inspector.test.ts` — inspector SSR tests
- `tests/e2e/specs/studio.ts` — E2E tests

---

_Update this file after every 2 view/browser/search operations_
