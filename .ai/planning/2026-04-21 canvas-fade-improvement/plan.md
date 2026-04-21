# Task Plan: Canvas Fade Improvement

## Goal

Make both the background grid and the GIF guide-line border fade to full transparency in all four directions, using the same fade shape and distance as the existing left/right grid fade.

## Current Phase

Phase 1

## Phases

### Phase 1: Research & Discovery

- [x] Read `FrameViewer.svelte` to understand current grid/guide-line/mask implementation
- [x] Identify why T/B doesn't fade (circle gradient on landscape viewport)
- [x] Identify why guide lines don't fade (no mask on `viewer-stage`)
- [x] Decide on approach (ellipse gradient + new guide-fade wrapper)
- [x] Document in `findings.md`
- **Status:** complete

### Phase 2: Implementation

Follow `rust-bevy-standards` does not apply; follow `rust-standards` for any Rust touches. Use `rust-svelte-conventions` (project conventions in `CLAUDE.md`) for Svelte.

Steps:
- [ ] Check and address compiler/TypeScript warnings (`pnpm check`)
- [ ] In `FrameViewer.svelte` — CSS: change `circle` → `ellipse` in the mask gradient
- [ ] Add `--fade-center-y: calc(50% + {panY}px)` to `viewer-grid-fade` style binding
- [ ] Update mask gradient centre: `var(--fade-center-x, 50%) var(--fade-center-y, 50%)`
- [ ] Restructure HTML: extract guide lines into new `viewer-guide-fade` → `viewer-guide-stage` wrapper with same mask and style binding; leave canvas in existing `viewer-stage`
- [ ] Add CSS for `.viewer-guide-fade` and `.viewer-guide-stage` (mirror `.viewer-grid-fade` / `.viewer-grid-stage` CSS)
- [ ] Update planning files in line with the `planning` skill
- **Status:** pending

### Phase 3: Unit & Rust Tests

- [ ] Run unit tests: `pnpm test:unit`
- [ ] Run Rust tests: `cargo test` (from `src-tauri/`)
- [ ] Fix any failures
- [ ] Update `progress.md` with results
- [ ] Update planning files in line with the `planning` skill
- **Status:** pending

### Phase 4: Build & E2E Tests

- [ ] Build app: `pnpm tauri build`
- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] Fix any failures
- [ ] Update `progress.md` with results
- [ ] Update planning files in line with the `planning` skill
- **Status:** pending

### Phase 5: Delivery

- [ ] Review all changes satisfy requirements
- [ ] Update all planning files to final state in line with the `planning` skill
- [ ] Deliver summary to user
- **Status:** pending

## Key Questions

1. Does the `ellipse` gradient change the L/R fade enough for the user to object? (Assumed acceptable — same stops, proportional equivalence.)
2. Are there existing unit/E2E tests that assert on specific mask values or guide-line widths that need updating?

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| `circle` → `ellipse` | Single-line change that makes fade proportional to viewport in both axes |
| Add vertical pan tracking | Symmetric with horizontal; zero impact when not panning |
| Separate `viewer-guide-fade` wrapper | Clean isolation; guide lines get the mask; canvas stays unmasked |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- Skills: no language-specific skill applies (Svelte/CSS change only); follow project conventions in `CLAUDE.md`
