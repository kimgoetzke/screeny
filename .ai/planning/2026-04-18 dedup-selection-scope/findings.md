# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: ~5 files modified (store, store tests, E2E spec, fixture creator, possibly a new fixture binary). Estimated 160–200 lines of change. TDD workflow mandates an explicit red → green cycle across unit and E2E layers.

## Requirements

- Both `deduplicateAdjacentMerge` and `deduplicateAdjacentDrop` must respect the current frame selection.
- **Multi-select (≥2 frames selected):** dedup runs only on the selected frames; non-selected frames are untouched.
- **Single-select (exactly 1 frame selected):** dedup runs on all frames (existing behaviour).
- Feature must be covered by unit tests (TDD, red→green) and an E2E test.

## Research Findings

### Frame store (`src/lib/stores/frames.svelte.ts`)

- `selectedFrameIds: Set<string>` — tracks multi-selection.
- `selectedFrameId: string | null` — tracks the anchor/primary selection.
- `deduplicateAdjacentMerge()` and `deduplicateAdjacentDrop()` currently iterate over all `frames`; they do not inspect `selectedFrameIds`.

### Dedup algorithms (current)

**Merge:** Walk `frames`; when `frame.imageData === previous.imageData`, accumulate duration into the kept frame.
**Drop:** Walk `frames`; when `frame.imageData === previous.imageData`, discard the duplicate (keep only first occurrence per run).

### Selection-scoped dedup — design decision

When `selectedFrameIds.size > 1`:
1. Extract selected frames in their original order (`selectedInOrder`).
2. Run the dedup algorithm on `selectedInOrder` → `dedupedSelection`.
3. Rebuild `frames`:
   - Walk the original `frames` array.
   - On encountering the **first** selected frame, emit all frames in `dedupedSelection`.
   - Skip any subsequent selected frame (it has been replaced or removed).
   - Non-selected frames are emitted as-is.

This handles both contiguous and non-contiguous selections naturally.

### Selection state after dedup

After rebuilding, if `selectedFrameId` no longer exists in the result:
- Set `selectedFrameId` to `dedupedSelection[0].id` (the kept frame at the start of the range).
- Set `selectedFrameIds` accordingly.

If `selectedFrameId` is still present, leave selection unchanged.

### Toolbar (`src/lib/components/Toolbar.svelte`)

No changes needed in the Toolbar — the buttons simply call `frameStore.deduplicateAdjacentMerge()` / `frameStore.deduplicateAdjacentDrop()`, and those methods will now read `selectedFrameIds` internally.

### Existing tests

- Unit tests: `src/lib/stores/frames.test.ts` — extensive coverage of dedup (single-frame selection path). New cases needed for multi-select path.
- Toolbar tests: `src/lib/components/Toolbar.test.ts` — button visibility only; no dedup logic tested here.
- E2E: `tests/e2e/specs/studio.ts` — `Studio — deduplicate frames` suite uses `dedup.gif` (3 frames: red, red, blue). New suite needed for selection-scoped dedup.

### E2E fixture requirements

The selection-scoped dedup test needs a fixture where:
- There are at least 4 frames.
- Some frames within a selection are adjacent duplicates.
- Frames outside the selection are different, so we can prove they are untouched.

Proposed fixture: **`dedup-selection.gif`** — 4 frames: `[red(100ms), red(200ms), blue(100ms), blue(150ms)]`

Test scenario (selection-scoped merge):
1. Load `dedup-selection.gif` → 4 frames.
2. Shift-select frames 0–1 (both red, adjacent duplicates).
3. Click **Dedup (merge)** → only frames 0–1 are deduped.
4. Assert: 3 frames remain — `[red(300ms), blue(100ms), blue(150ms)]`.
5. Frame 0 duration = 300ms; frame count = 3.

Test scenario (single-select → all frames deduped):
1. Load `dedup-selection.gif` → 4 frames.
2. Select only frame 0 (single).
3. Click **Dedup (merge)** → all frames deduped.
4. Assert: 2 frames remain — `[red(300ms), blue(250ms)]`.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Scoped dedup implemented in `frames.svelte.ts`, not in `Toolbar.svelte` | Keeps Toolbar as a thin presentation layer; logic belongs in the store |
| Reconstruct by "emit dedup'd block at first selected frame" | Works for both contiguous and non-contiguous selections without a separate insertion-index calculation |
| New fixture `dedup-selection.gif` (4 frames) | Allows a clear E2E proof that non-selected frames are untouched |
| Build fixture via extension of `create-dedup-fixture.mjs` | Reuses the existing minimal GIF encoder; no new dependencies |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

- Store: `src/lib/stores/frames.svelte.ts`
- Store tests: `src/lib/stores/frames.test.ts`
- Toolbar: `src/lib/components/Toolbar.svelte`
- Toolbar tests: `src/lib/components/Toolbar.test.ts`
- E2E spec: `tests/e2e/specs/studio.ts`
- Fixture creator: `tests/fixtures/create-dedup-fixture.mjs`
- Fixture binary: `tests/fixtures/dedup.gif`
- Proposed new fixture creator: `tests/fixtures/create-dedup-selection-fixture.mjs`
- Proposed new fixture: `tests/fixtures/dedup-selection.gif`

## Visual/Browser Findings

_N/A — no browser or image inspection performed._

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
