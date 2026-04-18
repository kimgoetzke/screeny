# Task Plan: Dedup scoped to frame selection

## Goal

When multiple frames are selected, `deduplicateAdjacentMerge` and `deduplicateAdjacentDrop` operate only on the selection; when a single frame is selected they operate on all frames (existing behaviour).

## Current Phase

Phase 1

## Phases

### Phase 1: Research & Discovery

- [x] Understand user intent
- [x] Read `frames.svelte.ts` — current dedup implementations
- [x] Read `frames.test.ts` — existing unit-test coverage
- [x] Read `Toolbar.svelte` — button wiring
- [x] Read `studio.ts` — existing E2E dedup tests and fixture
- [x] Read `create-dedup-fixture.mjs` — fixture format
- [x] Document findings in `findings.md`
- **Status:** complete

### Phase 2: New fixture for selection-scoped E2E tests

Use the `tdd` skill. Steps:

- [ ] Write `tests/fixtures/create-dedup-selection-fixture.mjs`:
  - 4-frame GIF: `[red(100ms), red(200ms), blue(100ms), blue(150ms)]`
  - Output: `tests/fixtures/dedup-selection.gif`
- [ ] Run the script to generate the binary fixture
- [ ] Update `findings.md` and `progress.md`
- **Status:** pending

### Phase 3: Unit tests (TDD — red phase)

Use the `tdd` skill. Add tests to `src/lib/stores/frames.test.ts`:

**`deduplicateAdjacentMerge` — selection-scoped:**
- When 2+ frames are selected and contain adjacent duplicates, only the selected frames are deduped (non-selected frames unchanged).
- When 2+ frames are selected but contain no adjacent duplicates, is a no-op for the selection.
- Duration of merged frames is summed (merge semantics).
- After scoped merge, `selectedFrameIds` and `selectedFrameId` are updated if the selected frame was removed.
- Single-frame selection → applies to all frames (no change to existing behaviour).

**`deduplicateAdjacentDrop` — selection-scoped:**
- Same matrix as above but with drop semantics (duration not accumulated).

Run `pnpm test:unit` after adding tests to confirm they are **red** (failing).

- [ ] Add selection-scoped unit tests for merge
- [ ] Add selection-scoped unit tests for drop
- [ ] Run tests — confirm red
- [ ] Update `findings.md` and `progress.md`
- **Status:** pending

### Phase 4: Implementation (TDD — green phase)

Use the `tdd` skill. Modify `src/lib/stores/frames.svelte.ts`:

**Algorithm change (both functions):**

```
if selectedFrameIds.size > 1:
    selectedInOrder = frames in order where id ∈ selectedFrameIds
    dedupedSelection = dedup(selectedInOrder)
    rebuild frames:
        for each frame in frames:
            if frame is first selected frame → emit dedupedSelection
            elif frame is a (non-first) selected frame → skip
            else → emit frame
    update selectedFrameId / selectedFrameIds if needed
else:
    existing full-array logic
```

Run `pnpm test:unit` after implementing to confirm tests are **green**.

- [ ] Modify `deduplicateAdjacentMerge` to be selection-aware
- [ ] Modify `deduplicateAdjacentDrop` to be selection-aware
- [ ] Run `pnpm test:unit` — confirm green
- [ ] Update `findings.md` and `progress.md`
- **Status:** pending

### Phase 5: E2E tests

Use the `tdd` skill. Add a new describe block to `tests/e2e/specs/studio.ts`:

**`Studio — deduplicate frames (selection-scoped)`**

Setup: load `dedup-selection.gif` (4 frames).

Tests:
1. Load fixture and verify 4 frames.
2. Shift-select frames 0–1 → dedup-merge → assert 3 frames remain, frame 0 duration = 300ms, frames 1–2 still present.
3. Reload fixture.
4. Shift-select frames 0–1 → dedup-drop → assert 3 frames remain, frame 0 duration = 100ms.
5. Reload fixture.
6. Select frame 0 only (single) → dedup-merge → assert 2 frames remain (all-frames path).
7. Reload fixture.
8. Select frame 0 only (single) → dedup-drop → assert 2 frames remain (all-frames path).

Note: E2E tests cannot be run automatically (require a built Tauri app + tauri-driver + WebKitWebDriver). Document this limitation in `progress.md`.

- [ ] Add `Studio — deduplicate frames (selection-scoped)` describe block
- [ ] Update `progress.md`
- **Status:** pending

### Phase 6: Delivery

- [ ] Ensure all unit tests pass (`pnpm test:unit`)
- [ ] Confirm all planning files are up-to-date per the `planning` skill
- [ ] Summarise deliverables for user
- **Status:** pending

## Key Questions

1. Should non-contiguous selections be supported? → **Confirmed (Q1).** The "emit dedup'd block at first selected frame" approach handles this naturally; non-selected frames between selected ones are treated as outside the dedup scope.
2. What should `selectedFrameIds` be after a scoped dedup removes some selected frames? → Set it to the IDs of the frames that survive (the dedup'd selection result).

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Logic lives in `frames.svelte.ts` only | Toolbar stays as a thin view |
| `selectedFrameIds.size > 1` is the predicate | 1 selected = "all frames" (natural default); ≥2 selected = scoped |
| Reconstruct by "emit block at first selected frame" | Handles contiguous and non-contiguous selections without index arithmetic |
| New fixture `dedup-selection.gif` (4 frames) | Proves non-selected frames are untouched in E2E |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Use `tdd` skill for all code-writing phases (Phase 2–5)
- Use `rust-standards` / `rust-bevy-standards` are not relevant here (TypeScript only)
- Re-read this plan before major decisions
- Log ALL errors — they help avoid repetition
