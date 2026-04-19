# Progress Log

## Session: 2026-04-19

### Phase 1: Store Methods (TDD)

- **Status:** complete
- Actions taken:
  - TDD cycles for `setFrameDuration`: 5 tests, all passing
  - TDD cycles for `duplicateSelectedFrames`: 6 tests, all passing
  - All 201 unit tests pass, no regression
- Files created/modified:
  - `src/lib/stores/frames.svelte.ts` — added `setFrameDuration` and `duplicateSelectedFrames`
  - `src/lib/stores/frames.test.ts` — added 11 new tests

### Phase 2: Inspector Component (TDD)

- **Status:** complete
- Actions taken:
  - Wrote `Inspector.test.ts` (17 tests): empty state, frame indicator, bulk-edit tag, duration input, dedup buttons, action buttons, minimise/restore
  - Implemented `Inspector.svelte` with all sections; fixed Svelte `state_referenced_locally` warning via `untrack()`
  - All 219 unit tests pass
- Files created/modified:
  - `src/lib/components/Inspector.svelte` — new component
  - `src/lib/components/Inspector.test.ts` — new test file (17 tests)

### Phase 3: Layout Integration

- **Status:** complete
- Actions taken:
  - Added `import Inspector from "$lib/components/Inspector.svelte"` to `+page.svelte`
  - Added `<Inspector />` as flex sibling of `<FrameViewer />` inside `.viewer-area`
  - All 219 unit tests pass, no regression
- Files created/modified:
  - `src/routes/+page.svelte` — imported and mounted Inspector

### Phase 4: E2E Tests & Full Regression

- **Status:** complete (E2E tests written; running requires a built app)
- Actions taken:
  - Appended `describe("Studio — inspector panel", ...)` to `tests/e2e/specs/studio.ts` (10 tests)
  - All 219 unit tests pass
  - Rust tests pass (0 failed)
  - E2E tests cannot be run without `pnpm tauri build`
- Files created/modified:
  - `tests/e2e/specs/studio.ts` — 10 new inspector E2E tests appended

### Phase 5: Inspector UI Fixes

- **Status:** complete
- Actions taken:
  - TDD RED: Added 3 failing Inspector tests (footer always present ×2, Duration: label ×1) and 2 failing ZoomIndicator tests (rightOffset inline style, default 10px)
  - TDD GREEN: Rewrote Inspector.svelte — floating layout, SVG toggle icons, `$bindable()` minimised prop, bulk-edit tag fix, inline duration row
  - TDD GREEN: Updated ZoomIndicator.svelte — added `rightOffset` prop, removed hardcoded `right: 10px` from CSS
  - Updated +page.svelte — binds `inspectorMinimised`, computes `zoomRightOffset` (60 or 268), passes to ZoomIndicator
  - Added 4 new E2E tests: footer always present, floating gap, zoom reposition, duration label text
  - 224/224 unit tests pass; Rust tests pass (0 failed); E2E skipped (requires built app)
- Files created/modified:
  - `src/lib/components/Inspector.svelte` — fully rewritten
  - `src/lib/components/Inspector.test.ts` — 3 new tests
  - `src/lib/components/ZoomIndicator.svelte` — rightOffset prop added
  - `src/lib/components/ZoomIndicator.test.ts` — 2 new tests
  - `src/routes/+page.svelte` — bind + zoomRightOffset
  - `tests/e2e/specs/studio.ts` — 4 new inspector UI E2E tests

## Test Results

| Test | Input | Expected | Actual | Status |
| ---- | ----- | -------- | ------ | ------ |

## Error Log

| Timestamp | Error | Attempt | Resolution |
| --------- | ----- | ------- | ---------- |

### Phase 6: Inspector Improvements & Bug Fixes

- **Status:** complete
- Actions taken:
  - TDD RED: Created `src/routes/+page.test.ts` with 3 source inspection tests for Ctrl+I
  - Discovered pre-existing regression: Inspector.svelte showed "No frame(s) selected" but test expected "No frame selected" — fixed
  - TDD GREEN: Fixed `handleDurationWheel` deltaX fallback for WebKit Shift+scroll
  - TDD GREEN: CSS changes in Inspector.svelte — all caps, 24px gap, footer right-align, action buttons flex:1, spin buttons removed
  - TDD GREEN: Added Ctrl+I window keydown handler to +page.svelte
  - TDD GREEN: Added `dropOverlayRightMargin` derived state and applied to `.drop-overlay`
  - Added Phase 6 E2E suite with 7 tests; updated existing frame indicator text assertions to uppercase
  - All 227/227 unit tests pass; Rust tests pass (0 failed); E2E skipped (requires built app)
- Files created/modified:
  - `src/lib/components/Inspector.svelte` — scroll fix, CSS improvements, "No frame selected" text fix
  - `src/routes/+page.svelte` — Ctrl+I shortcut, drop overlay right margin
  - `src/routes/+page.test.ts` — new file; 3 source inspection tests
  - `tests/e2e/specs/studio.ts` — Phase 6 suite (7 E2E tests), jsWheel/jsWheelShift helpers, updated uppercase assertions

## 5-Question Reboot Check

| Question             | Answer                                              |
| -------------------- | --------------------------------------------------- |
| Where am I?          | Phase 6 complete                                           |
| Where am I going?    | All phases complete                                        |
| What's the goal?     | Inspector panel UI improvements and bug fixes              |
| What have I learned? | See findings.md — Phase 6 research findings section        |
| What have I done?    | All 6 phases complete; 227/227 unit tests; Rust tests pass |
