# Task Plan: Remove splash header bar

## Goal

Remove native window chrome from the splash screen so it no longer shows the standard header bar controls, while leaving the main app window unchanged.

## Current Phase

Phase 2

## Phases

### Phase 1: Requirements & Discovery

- [x] Confirm the splash window is created separately from the main window
- [x] Identify where splash chrome is configured
- [x] Document findings in `findings.md`
- [x] Decide plan size and required planning files
- [x] Update planning artefacts in line with the `planning` skill
- **Status:** complete

### Phase 2: Implement splash window chrome removal

- [ ] Re-read this `plan.md` before changing code
- [ ] Use the `tdd` skill to drive the implementation and validation approach
- [ ] Follow the `rust-standards` skill for the Rust window-builder change
- [ ] Update `src-tauri/src/lib.rs` so the splash window is created without native decorations
- [ ] Keep the main window config in `src-tauri/tauri.conf.json` unchanged
- [ ] Add or update the most appropriate regression coverage for splash-window behaviour
- [ ] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

### Phase 3: Verify startup behaviour

- [ ] Re-read this `plan.md` before major validation decisions
- [ ] Run the smallest relevant existing test commands first
- [ ] Confirm the splash still appears and the main window still takes over correctly
- [ ] If automated coverage cannot observe native chrome directly, document the gap and use the strongest available validation path
- [ ] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

### Phase 4: Delivery

- [ ] Review changed files and ensure scope stayed splash-only
- [ ] Record final outcomes and any limitations in the planning artefacts
- [ ] Deliver the completed change summary to the user
- [ ] Update `findings.md`, `plan.md`, and `progress.md` in line with the `planning` skill before ending the phase
- **Status:** pending

## Key Questions

1. Is `.decorations(false)` alone sufficient across the target platforms for the intended splash appearance?
2. Can existing E2E coverage reliably assert absence of native title-bar controls, or will validation remain partly manual/platform-specific?

## Decisions Made

| Decision                                                               | Rationale                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Treat this as a splash-window builder change in Rust                   | The splash window is created in `src-tauri/src/lib.rs`, separate from the main window config. |
| Leave `tauri.conf.json` main-window config untouched                   | The request is splash-only and the main window already has separate config ownership.         |
| Plan for regression coverage, but not via splash HTML unit tests alone | Native window chrome is not represented in `static/splashscreen.html`.                        |

## Errors Encountered

| Error    | Attempt | Resolution |
| -------- | ------- | ---------- |
| None yet | 1       | N/A        |

## Notes

- Multi-phase plan selected because the full task is expected to exceed 5 tool uses and needs persistent progress tracking.
- No open user question is required at planning time; scope is clear from the request.
