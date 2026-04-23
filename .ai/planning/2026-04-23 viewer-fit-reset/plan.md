# Task Plan: Viewer fit, single align, and reset zoom regression

## Goal

Restore correct viewer placement so loaded GIFs fit to 70% of the visible viewer area, only align once during streamed load, and re-centre correctly when `Reset zoom` is used after inspector layout changes.

## Current Phase

Phase 5 complete

## Phases

### Phase 1: Requirements & Discovery

- [x] Trace the current fit and reset flow in `src/lib/viewer-fit.ts` and `src/routes/+page.svelte`
- [x] Identify the existing unit, source-level, and E2E tests that encode the current 80% behaviour
- [x] Record findings in `findings.md` and initialise planning files in line with the `planning` skill
- **Status:** complete

### Phase 2: TDD the new fit and lifecycle contract

- [x] Invoke the `tdd` skill before any code changes
- [x] Update `src/lib/viewer-fit.test.ts` to express the new 70% fit rule and true centring on both axes for wide/tall inputs
- [x] Update `src/routes/page.test.ts` so it stops expecting the second `applyInitialViewerState()` fallback and starts asserting the reset path recalculates against current visible bounds
- [x] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill before closing the phase
- **Status:** complete

### Phase 3: Implement the fit and reset fixes

- [x] Continue under the `tdd` skill and make the production changes required by the failing tests
- [x] Refactor `src/lib/viewer-fit.ts` to use a 70% fit ratio and return both horizontal and vertical centring offsets from the visible viewer area
- [x] Refactor `src/routes/+page.svelte` so streamed loads apply the initial fit once, the decode-complete path only handles completion, and `resetView()` reuses the current visible bounds instead of stale load-time pan state
- [x] Check warnings surfaced by the affected toolchain and either fix them or capture a clear rationale for leaving them unchanged
- [x] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill before closing the phase
- **Status:** complete

### Phase 4: Extend E2E coverage and run full verification

- [x] Continue under the `tdd` skill and update `tests/e2e/specs/studio.ts`
- [x] Rewrite existing load-fit assertions from 80% to 70% for landscape and portrait fixtures
- [x] Add/extend an E2E case proving that after inspector minimise/restore changes the available canvas space, `Reset zoom` appears and re-centres the GIF correctly in the current visible area
- [x] Run `pnpm check`, `pnpm build`, `pnpm tauri build`, `pnpm test:e2e`, `pnpm test:unit`, and `cargo test` from `src-tauri`, keeping the required build-before-E2E ordering
- [x] Record test results, warnings, and any failures in `progress.md`, then refresh `findings.md` and `plan.md` in line with the `planning` skill
- **Status:** complete

### Phase 5: Final review and handoff

- [x] Re-read this plan and confirm every user requirement is covered: 70% fit, single align, restored reset-after-inspector-toggle behaviour, warning handling, and full coverage
- [x] Update all planning files one final time in line with the `planning` skill
- [x] Deliver the implementation summary, changed files, warning outcome, and verification results
- **Status:** complete

## Key Questions

1. Which existing tests lock in the old 80% and double-align behaviour? `src/lib/viewer-fit.test.ts`, `src/routes/page.test.ts`, and `tests/e2e/specs/studio.ts`.
2. Where should the centring maths live? In `src/lib/viewer-fit.ts`, reused by both initial load placement and reset recalc.
3. How should warnings be handled? Treat relevant warnings as work items: fix them when they stem from touched code, otherwise document why they are unrelated or acceptable.

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Keep the fit maths in `src/lib/viewer-fit.ts` | One helper should define both initial load placement and reset placement, avoiding drift. |
| Use `src/routes/page.test.ts` for the load lifecycle contract | The second-alignment regression is orchestration in `+page.svelte`, and this file already guards that contract cheaply. |
| Extend the existing studio geometry helper instead of adding new E2E plumbing | `getLoadedGifFitMetrics()` already exposes the exact ratios and centre deltas the new assertions need. |
| Run the full validation chain in Phase 4 | The change crosses Svelte UI, E2E behaviour, and Rust-backed app packaging, so partial verification is not enough. |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| None during implementation or verification | 1 | N/A |

## Notes

- Re-read this plan before major implementation decisions.
- Do not repeat a failed verification step unchanged; follow the 3-strike protocol from the `planning` skill.
- Keep `findings.md`, `plan.md`, `questions.md`, and `progress.md` current at the end of each implementation phase.
