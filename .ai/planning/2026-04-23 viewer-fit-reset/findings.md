# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: this work spans viewer layout logic, load lifecycle, inspector-triggered reset behaviour, unit tests, E2E coverage, and full verification commands; it will exceed 5 tool uses and likely touch more than 5 files.

## Requirements

## Captured from user request

- Change initial GIF fit so loaded content occupies 70% of the available viewer size, leaving 15% margin to the nearest visible edge on all sides.
- Make the fit calculation symmetric across both axes; it must not only bias left/right spacing for wide images.
- Remove the second post-load alignment pass that currently repositions the GIF/canvas again after the last frame loads.
- Restore `Reset zoom` so, after inspector visibility/size changes, it re-centres the image using the current available canvas space.
- Keep this behaviour working for inspector minimise/maximise toggles.
- Ensure full automated coverage, including E2E coverage for initial load positioning and reset-after-inspector-toggle behaviour.
- Implementation must be planned around use of the `tdd` skill.
- During execution, check warnings and either fix them or explain why they should remain.
- Verification scope for execution must include building before E2E, then all E2E tests, all unit tests, and all Rust tests.

## Research Findings

## Key discoveries during exploration

- Existing search results already point at `src/lib/viewer-fit.test.ts` for fit-related unit coverage.
- Main page inspector state is likely coordinated in `src/routes/+page.svelte`, which references inspector visibility/minimised state.
- Existing E2E coverage lives in `tests/e2e/specs/studio.ts`; this is the likely place for new viewer-positioning and reset-zoom regression coverage.
- `calculateInitialViewerState` already has unit tests that encode the current 80% fit rule for portrait and landscape GIFs in `src/lib/viewer-fit.test.ts`.
- `src/routes/+page.svelte` owns the load-time fit application and current reset behaviour.
- `resetView()` currently hard-resets to `viewerScale = 1`, `viewerPanX = initialViewerPanX`, and `viewerPanY = 0`; it does not recalculate visible bounds when inspector layout changes.
- `getVisibleViewerBounds()` currently adjusts only the visible width by subtracting the inspector area; visible height always equals full viewer height.
- `handleDrop()` applies the initial viewer state twice: once after the first decoded frame arrives, then again in `finally` after decoding completes.
- `src/lib/viewer-fit.ts` uses `INITIAL_FIT_RATIO = 0.8` and selects preferred scale by orientation (`gifHeight > gifWidth` → height-driven, else width-driven), then only offsets horizontally via `visibleOffsetX`; `panY` is always `0`.
- Existing E2E helper `getLoadedGifFitMetrics()` in `tests/e2e/specs/studio.ts` already measures loaded canvas width/height ratios plus centre deltas relative to the visible viewer area, so it is a good base for coverage of the 70% fit and centring rules.
- `ZoomIndicator.svelte` already exposes the reset affordance behind `data-testid="zoom-reset"` whenever `isModified` is true, so the regression is likely upstream in how reset state is recalculated rather than in the control itself.
- `Inspector.svelte` already exposes minimise/restore controls via `data-testid="inspector-minimise"` and `data-testid="inspector-restore"`, which gives a stable E2E entry point for the requested regression tests.
- `src/routes/page.test.ts` is a source-level regression suite for `+page.svelte`; it currently asserts the now-undesired fallback `await applyInitialViewerState()` in `handleDrop()`, so this file must change as part of the plan.
- `tests/e2e/specs/studio.ts` already contains loaded-fit assertions anchored to the current `0.8` ratio for both wide and tall fixtures, plus reset-zoom and inspector toggle coverage at other points in the spec.
- `package.json` confirms the frontend validation commands needed during execution: `pnpm check`, `pnpm build`, `pnpm test:unit`, and `pnpm test:e2e`.
- `src-tauri/Cargo.toml` confirms Rust validation should be run from `src-tauri` via `cargo test`.
- Targeted E2E searches found separate reset-zoom tests and separate inspector minimise/restore tests, but no combined regression case that proves `Reset zoom` re-centres correctly after inspector layout changes.
- Final implementation keeps two viewer concepts in `src/routes/+page.svelte`: the current rendered state (`viewerBaseScale`, `viewerScale`, `viewerPanX`, `viewerPanY`) and a reset target (`resetViewerBaseScale`, `resetViewerPanX`, `resetViewerPanY`).
- The `ZoomIndicator` now reads a reset-aware scale ratio instead of the raw relative zoom factor, so inspector layout changes can surface `Reset zoom` without moving the canvas immediately.
- `handleDrop()` now applies the initial fit only on the first decoded frame; decode completion only clears loading state.
- Full verification completed successfully: `pnpm check` reported `0 errors and 0 warnings`, `pnpm tauri build` succeeded, full E2E passed (`101 passing` across both specs), full unit tests passed (`303 passed`), and `cargo test` passed (`27 passed` in `screeny_lib`).

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Treat this as a multi-phase plan | The work crosses UI state, fit maths, load lifecycle, tests, and full validation. |
| Plan implementation around `tdd` skill usage | The user explicitly requires TDD for code changes, and the planning skill requires that relevant skills be called out in the plan. |
| Expect the main behavioural fix to span both fit maths and reset orchestration | The current regression is not only a maths issue; page-level reset logic is also coupled to stale `initialViewerPanX`. |
| Reuse existing E2E geometry helpers where possible | `studio.ts` already exposes viewport/canvas metric helpers, reducing new test-only plumbing. |
| Keep test work close to existing selectors and helpers | The inspector and zoom controls already have stable `data-testid` hooks, so new E2E coverage can avoid brittle DOM traversal. |
| Update existing assertions rather than duplicating them | The repo already encodes the old 80% behaviour in unit, source-level, and E2E tests; the cleanest implementation path is to revise those expectations and add only the missing regression case. |
| Reuse `calculateInitialViewerState` for reset recalc instead of open-coding maths in `resetView` | One shared fit calculation reduces divergence between first-load placement and post-inspector reset placement. |
| Keep current view state separate from the reset target | This restores the old UX: inspector width changes can make the image “dirty” and show `Reset zoom` without unexpectedly moving or resizing the GIF until the user asks for it. |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| Initial broad search returned too much output for one read | Narrow follow-up reads to the fit helper, page component, and studio spec, then update findings incrementally. |
| Focused E2E grep run returned too little output to rely on as the only signal | Followed it with the required full `pnpm test:e2e` run and inspected the final summary lines directly. |

## Resources

## URLs, file paths, API references

- `src/lib/viewer-fit.test.ts`
- `src/lib/viewer-fit.ts`
- `src/lib/components/ZoomIndicator.svelte`
- `src/lib/components/Inspector.svelte`
- `src/routes/+page.svelte`
- `src/routes/page.test.ts`
- `tests/e2e/specs/studio.ts`
- `package.json`
- `src-tauri/Cargo.toml`
- Existing E2E helper: `getLoadedGifFitMetrics()` in `tests/e2e/specs/studio.ts`
- Planning folder: `.ai/planning/2026-04-23 viewer-fit-reset/`

## Visual/Browser Findings

## Multimodal content must be captured as text immediately

- None yet.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
