# Task Plan: Inspector Side Panel

## Goal

Add a collapsible inspector side panel that shows frame info and provides duration editing, dedup, duplicate, and delete controls for the selected frame(s); with a floating panel layout, correct toggle-button placement, proper SVG icons, and an inline duration row.

## Current Phase

Phase 5 (complete)

## Phases

### Phase 1: Store Methods (TDD)

Add `setFrameDuration` and `duplicateSelectedFrames` to `frameStore`, test-first per `tdd` skill.

- [x] RED: Write failing tests for `setFrameDuration(duration)` — sets duration on all selected frames, clamps to 1–9999
- [x] GREEN: Implement `setFrameDuration` in `frames.svelte.ts`
- [x] RED: Write failing tests for `duplicateSelectedFrames()` — clones selected frames, inserts after selection
- [x] GREEN: Implement `duplicateSelectedFrames` in `frames.svelte.ts`
- [x] REFACTOR: Clean up if needed
- [x] Run unit tests (`pnpm test:unit`) to verify no regression
- [x] Update planning docs per `planning` skill
- **Status:** complete

### Phase 2: Inspector Component (TDD)

Build `Inspector.svelte` with SSR-only unit tests, following existing component patterns.

- [x] RED: Write `Inspector.test.ts` — tests for: empty state, frame indicator text, bulk edit tag, duration input, dedup buttons visibility, duplicate/delete buttons, minimise/restore toggle
- [x] GREEN: Implement `Inspector.svelte` with all sections
- [x] REFACTOR: Clean up styles and structure
- [x] Run unit tests to verify no regression
- [x] Update planning docs per `planning` skill
- **Status:** complete

### Phase 3: Layout Integration

Wire `Inspector` into `+page.svelte` layout.

- [x] Add `Inspector` as flex sibling inside `.viewer-area`
- [x] Verify viewer area resizes correctly
- [x] Run unit tests to verify no regression
- [x] Update planning docs per `planning` skill
- **Status:** complete

### Phase 4: E2E Tests & Full Regression

Write E2E test for the inspector feature and run all test suites.

- [x] Write E2E tests in `tests/e2e/specs/studio.ts`: inspector visibility, duration editing, dedup buttons, duplicate, delete, minimise/restore
- [x] Run all unit tests (`pnpm test:unit`)
- [x] Run Rust tests (`cargo test`)
- [ ] Run E2E tests (`pnpm test:e2e`) — requires built app; skipped (no build available)
- [x] Fix any regressions
- [x] Update planning docs per `planning` skill — mark all phases complete
- **Status:** complete (E2E requires built app to run)

### Phase 5: Inspector UI Fixes (TDD)

Fix six visual/UX issues reported after initial implementation.

**Inspector.svelte — structural changes:**
- [x] RED: Write failing unit tests for:
  - `Duration:` label present in the same row as the input (not above it)
  - Toggle button (`inspector-minimise` / `inspector-restore`) always at the bottom
- [x] GREEN: Implement changes:
  - Float the panel (`position: absolute; right: 8px; top: 8px; bottom: 8px; border-radius: 8px`) — remove from flex flow
  - Collapsed width `32px`, expanded width `240px`
  - Move toggle button to a `inspector-footer` div always rendered at the bottom of `<aside>`
  - Replace text `-&gt;|` / `|&lt;-` with proper SVG "sidebar collapse/expand" icons
  - Make `minimised` a `$bindable()` prop so `+page.svelte` can track state
  - `align-self: flex-start` on `.bulk-edit-tag`
  - Flatten duration row: remove separate `<label>` above input; add "Duration:" label as first child of `.duration-row`; input fills remaining width (`flex: 1`)
- [x] REFACTOR: Clean up
- [x] Run unit tests (`pnpm test:unit`) — 224/224 pass

**ZoomIndicator.svelte:**
- [x] RED: Add unit tests for `rightOffset` prop (inline style, default 10px)
- [x] GREEN: Add `rightOffset?: number = 10` prop; apply via `style:right="{rightOffset}px"`; remove hardcoded `right: 10px` from CSS
- [x] Run unit tests (`pnpm test:unit`) — 224/224 pass

**+page.svelte integration:**
- [x] Bind `<Inspector bind:minimised={inspectorMinimised} />`
- [x] Compute `zoomRightOffset` — minimised: 60px, expanded: 268px
- [x] Pass `rightOffset={zoomRightOffset}` to `<ZoomIndicator />`
- [x] Run unit tests (`pnpm test:unit`) — 224/224 pass
- [x] Run Rust tests — 0 failed

**E2E tests:**
- [x] Extended "inspector panel" suite: footer always present, floating gap, zoom reposition, duration label text
- [x] All unit tests pass (224/224)
- [x] Rust tests pass (0 failed)
- [ ] Run E2E tests (`pnpm test:e2e`) — requires built app; skipped
- [x] Update planning docs per `planning` skill — mark Phase 5 complete
- **Status:** complete (E2E requires built app to run)

## Key Questions

1. ~~Duration display for multi-select with mixed durations~~ — **Resolved**: show "Mixed" placeholder, empty value; standard HTML placeholder behaviour (Q1)
2. ~~Inspector panel width~~ — **Resolved**: 240px (Q2)
3. ~~Duplicate frame ID generation~~ — **Resolved**: `crypto.randomUUID()` confirmed (Q3→Q4)

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| ~~Inspector inside `.viewer-area` as flex sibling~~ → now `position: absolute` | Floating panel with gaps requires absolute positioning; FrameViewer fills all space |
| Store owns all mutations | Consistent with existing architecture |
| Local state for minimise toggle | Not needed globally |
| Reuse existing dedup store methods | They already handle selection scope |
| TDD per `tdd` skill in each phase | Required by user |
| Mixed durations → "Mixed" placeholder on input | User prefers placeholder that clears on focus; standard HTML `placeholder` attr |
| Inspector panel width: 240px | User choice; easy to adjust later |
| `crypto.randomUUID()` for duplicate frame IDs | IDs are frontend-only (stripped on export); confirmed by user |
| Single toggle button with dynamic `data-testid` | Avoids separate minimise/restore buttons; `data-testid` switches between `inspector-minimise` and `inspector-restore` based on state |
| `minimised` as `$bindable()` prop | Allows `+page.svelte` to track inspector state and offset ZoomIndicator |
| ZoomIndicator `rightOffset` prop | Keeps ZoomIndicator always 20px left of the inspector, regardless of its collapsed/expanded state |
| Inspector gap from edges: 8px | Consistent with `.drop-overlay` margin |
| Minimised inspector width: 32px | Just enough to show the 24px SVG toggle button with 4px padding each side |
| Duration row flattened: label + input + unit on one line | User-requested; input gets `flex: 1` to fill remaining space |
| Bulk edit tag: `align-self: flex-start` | Prevents it from stretching to full flex-column width |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |

## Notes

- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- Skills to use: `tdd` for all code phases
