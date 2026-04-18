# Task Plan: Adjacent frame deduplication

## Goal

Add two conditional toolbar actions that deduplicate only later adjacent duplicate GIF frames, one merging duration and one strictly dropping duplicates, with TDD-first unit coverage and an E2E flow proving the behaviour in the studio.

## Current Phase

Phase 2

## Phases

### Phase 1: Confirm behaviour and lock test scope

- [x] Resolve adjacent-deduplication behaviour.
- [x] Confirm that the scope now includes two toolbar actions: merge-duration and drop-duration.
- [x] Identify likely fixture work for deterministic E2E coverage.
- [x] Update `findings.md`, `questions.md`, and this `plan.md` in line with the `planning` skill before moving on.
- **Status:** complete

### Phase 2: Write failing unit tests with TDD

- [ ] Use the `tdd` skill to add failing store tests for both adjacent-only deduplication modes, no-op cases, and selection behaviour.
- [ ] Use the `tdd` skill to add failing toolbar SSR tests for both button visibilities and placement relative to `btn-stop`.
- [ ] Update `findings.md`, `progress.md`, and this `plan.md` in line with the `planning` skill at the end of the phase.
- **Status:** pending

### Phase 3: Implement store and toolbar changes

- [ ] Use the `tdd` skill to add explicit frame-store operations for both deduplication modes without broad fallbacks.
- [ ] Wire the two toolbar buttons so they appear only when frames exist and sit immediately to the right of the stop button.
- [ ] Reconcile frame selection/playback state after removal and document the decision in `findings.md`.
- [ ] Update `findings.md`, `progress.md`, and this `plan.md` in line with the `planning` skill at the end of the phase.
- **Status:** pending

### Phase 4: Add E2E coverage

- [ ] Use the `tdd` skill to add or adapt an E2E fixture with adjacent duplicate frames.
- [ ] Add an E2E scenario in `tests/e2e/specs/studio.ts` proving both buttons are hidden when empty, visible when loaded, and affect only adjacent duplicates in their respective ways.
- [ ] Update `findings.md`, `progress.md`, and this `plan.md` in line with the `planning` skill at the end of the phase.
- **Status:** pending

### Phase 5: Validate and hand off

- [ ] Run the smallest relevant validation commands first, then any broader required checks.
- [ ] Record test results and any errors in `progress.md`.
- [ ] Mark completed phases, refresh planning files per the `planning` skill, and prepare the implementation summary.
- **Status:** pending

## Key Questions

1. What deterministic fixture shape best proves both adjacent-only behaviours without depending on the existing shared studio-state sequence?
2. What concise labels or tooltips best distinguish the merge and drop actions without crowding the toolbar?

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Keep deduplication adjacent-only | Matches the requested scope exactly |
| Put both actions in the toolbar next to `btn-stop` | Matches the requested UI placement |
| Provide both merge-duration and drop-duration modes | User explicitly requested two buttons |
| Treat this as TDD-led multi-phase work | Required by the user and the planning-skill size rules |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| None yet | 1 | N/A |

## Notes

- Re-read this plan before major implementation decisions.
- Do not repeat a failed validation step unchanged; switch approach and log it.
