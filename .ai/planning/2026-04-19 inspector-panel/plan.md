# Task Plan: Inspector Side Panel

## Goal

Add a collapsible inspector side panel that shows frame info and provides duration editing, dedup, duplicate, and delete controls for the selected frame(s); with a floating panel layout, correct toggle-button placement, proper SVG icons, and an inline duration row.

## Current Phase

Phase 6 (complete)

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

### Phase 6: Inspector Improvements & Bug Fixes (TDD)

Fix 8 reported issues: Shift+scroll bug, CSS improvements (frame indicator all caps, more spacing, toggle button right-aligned, equal-width action buttons, spin button styling), Ctrl+I shortcut, and drag-and-drop overlay overlap.

**Files to change:** `Inspector.svelte`, `Inspector.test.ts`, `+page.svelte`, `tests/e2e/specs/studio.ts`, plus a possible new `+page.test.ts` for source inspection.

**TDD RED — write failing tests first:**
- [x] RED: Add source inspection tests in `src/routes/+page.test.ts` (new file):
  - `+page.svelte` contains a `keydown` window listener
  - Handles `ctrlKey` + key `"i"` / `"I"`
  - Toggles `inspectorMinimised`
- [x] RED: Add E2E tests for all 8 changes — they will fail until built app is available

**TDD GREEN — implement all changes in `Inspector.svelte`:**
- [x] Fixed pre-existing regression: "No frame(s) selected" → "No frame selected"
- [x] Fix `handleDurationWheel`: fall back to `event.deltaX` when `event.deltaY === 0`; guard against both-zero (no-op)
- [x] CSS: `.frame-indicator` — added `text-transform: uppercase; letter-spacing: 0.05em`
- [x] CSS: `.inspector-body` — increased `gap` from `12px` to `24px`
- [x] CSS: `.inspector-footer` — changed `justify-content: center` to `justify-content: flex-end`
- [x] CSS: `.action-buttons button` — added `flex: 1`
- [x] CSS: Duration input spin buttons removed via `appearance: textfield` + `::-webkit-inner-spin-button { display: none }`

**TDD GREEN — implement changes in `+page.svelte`:**
- [x] Added Ctrl+I window `keydown` listener in a `$effect`; follows `Timeline.svelte` pattern
- [x] Added `dropOverlayRightMargin = $derived(inspectorMinimised ? 48 : 256)`; applied as `style:margin-right` on `.drop-overlay`

**TDD REFACTOR:**
- [x] Clean up done
- [x] Run unit tests (`pnpm test:unit`) — 227/227 pass

**E2E tests in `tests/e2e/specs/studio.ts`:**
- [x] Ctrl+I minimises / restores the inspector
- [x] Shift+wheel (WebKit deltaX path) increases/decreases duration by ~100
- [x] Frame indicator text is all caps
- [x] Toggle button is right-aligned in footer
- [x] Drop overlay right boundary does not overlap inspector when expanded
- [x] Updated existing `toHaveText("Frame 1 of 2")` → `"FRAME 1 OF 2"` and multi-select equivalent
- [x] Added `jsWheel` and `jsWheelShift` helper functions

**Full regression:**
- [x] All unit tests (`pnpm test:unit`) — 227/227 pass
- [x] Rust tests (`cargo test`) — 0 failed
- [ ] Run E2E tests (`pnpm test:e2e`) — requires built app; skipped
- [x] Updated planning docs per `planning` skill — Phase 6 marked complete
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
| Shift+scroll fix via `deltaX` fallback | WebKit converts Shift+vertical-scroll to horizontal scroll, setting `deltaY=0` and `deltaX≠0`; checking `deltaX` when `deltaY===0` restores correct behaviour |
| Frame indicator all caps via CSS `text-transform: uppercase` | Consistent with `.inspector-title` styling; HTML content stays unchanged so existing unit tests don't break |
| Inspector body gap: 12px → 24px | User-requested; doubles spacing between all body sections |
| Toggle button footer: `justify-content: flex-end` | Right-aligns button so it stays at the same absolute position when panel is minimised (both states share the same right edge at `right: 8px`) |
| Action buttons: `flex: 1` | Equal width filling the full panel; no label text, so equal space is the right default |
| Duration input native spinners removed | Hid via `appearance: textfield` + `::-webkit-inner-spin-button { display: none }`; mouse wheel already handles increment so no functionality loss |
| Ctrl+I keyboard shortcut in `+page.svelte` | Global shortcut belongs in the page, not the component; follows same `$effect` + `window.addEventListener` pattern as `Timeline.svelte` |
| Drop overlay: Option 1 (dynamic right margin) | `inspectorMinimised` is already tracked in `+page.svelte`; simple `$derived` for margin-right eliminates overlap without layout complexity |
| Drop overlay right margin: 48px (minimised) / 256px (expanded) | 8px outer gap + panel width + 8px inner gap; symmetrical with panel positioning |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |

## Notes

- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- Skills to use: `tdd` for all code phases
