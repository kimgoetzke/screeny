# Task Plan: Initial GIF fit

## Goal

Make the initially loaded GIF render at a computed “100%” zoom that fits within the currently visible viewer space, uses exactly 80% of the constraining visible dimension, stays centred, respects expanded vs minimised inspector state, and does not change any later resize behaviour.

## Current Phase

Planning complete; implementation not started.

## Phases

### Phase 1: Requirements & Discovery

- [x] Capture the behavioural requirements and constraints from the user request
- [x] Find the route, viewer, inspector, and test seams involved in initial placement
- [x] Record discoveries in `findings.md`
- [x] Update planning files in line with the `planning` skill
- **Status:** complete

### Phase 2: TDD scaffolding for initial-fit state

- [ ] Read this `plan.md` before making implementation decisions
- [ ] Invoke the `tdd` skill before writing code
- [ ] Add failing unit tests for the initial-fit rules:
  - expanded inspector excludes its covered area from the visible viewer space
  - minimised inspector counts as visible space
  - portrait GIFs use 80% of visible height
  - landscape GIFs use 80% of visible width
  - the fitted result never exceeds visible width or height
  - the initial fitted state is treated as unmodified “100% zoom”
- [ ] If needed, introduce a focused helper for computing initial viewer state from GIF size plus visible viewer bounds
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

### Phase 3: Wire initial-fit logic into load flow

- [ ] Read this `plan.md` again before changing behaviour
- [ ] Continue using the `tdd` skill’s red/green/refactor loop
- [ ] Replace the current hard reset to literal `scale = 1` on GIF load with a computed initial-fit state
- [ ] Measure the visible viewer space at initial load only, excluding the expanded inspector footprint and including the minimised inspector gutter
- [ ] Preserve current centring, borders, grid, guide lines, and later manual zoom/pan behaviour
- [ ] Keep resize behaviour unchanged after the first loaded display; no new resize-triggered refit
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

### Phase 4: Add regression coverage for real layout behaviour

- [ ] Read this `plan.md` before choosing the test shape
- [ ] Continue via the `tdd` skill
- [ ] Extend or add E2E coverage for first-load fitting with representative portrait and landscape GIFs
- [ ] Cover inspector-expanded vs inspector-minimised initial load behaviour if current E2E fixtures and selectors make that practical
- [ ] Keep SSR unit tests focused on pure calculations/prop wiring and E2E tests focused on rendered geometry
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

### Phase 5: Full verification and warning triage

- [ ] Read this `plan.md` before final validation
- [ ] Check warnings from changed code and address them where they indicate a real issue; if any warning is intentionally left, record why
- [ ] Run `pnpm check`
- [ ] Run `pnpm build`
- [ ] Run `pnpm test:unit`
- [ ] Build the application before E2E with `pnpm tauri build`
- [ ] Run all E2E tests with `pnpm test:e2e`
- [ ] Run all Rust tests with `cargo test` from `src-tauri/`
- [ ] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

## Key Questions

1. What is the cleanest place to compute the initial-fit state: route-level load flow, `FrameViewer`, or a shared helper used by both tests and UI wiring?
2. How should the implementation obtain the visible viewer bounds at first display without introducing later resize-driven refits?
3. Which assertions belong in SSR unit tests versus E2E geometry checks?

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Treat this as a multi-phase task | It spans behaviour design, test updates, UI wiring, E2E work, and full-project verification |
| Use `tdd` for implementation | User explicitly requested it and the change has precise geometry rules suited to red/green coverage |
| Preserve the existing centring model if possible | Current stage/pan approach already centres within the visible viewer area; computing a new initial scale is lower risk than redesigning transforms |
| Keep resize behaviour out of scope | The user explicitly limited the work to first load / first frame display |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| None during planning | 1 | N/A |

## Notes

- Prefer a small pure calculation seam for the initial-fit state so SSR unit tests can cover the geometry rules without client mounting.
- Expect `src/routes/+page.svelte`, `src/lib/components/FrameViewer.svelte`, route/unit tests, and at least one E2E spec to change.
- The existing reset model and zoom indicator currently assume literal `scale = 1`; implementation will need to redefine “reset” and “unmodified” around the computed initial-fit baseline.
