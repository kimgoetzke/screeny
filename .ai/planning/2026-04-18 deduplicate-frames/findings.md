# Findings & Decisions

## Plan Size

**Multi-phase: Yes**

Reasoning: the change likely spans toolbar UI, toolbar unit tests, frame-store logic, frame-store unit tests, at least one E2E spec, and likely shared E2E helpers or selectors. That is already more than five files and more than five tool uses, with TDD and coverage likely pushing the total change beyond a trivial one-phase edit.

## Requirements

- Add adjacent-frame deduplication actions when a GIF is loaded.
- Show two toolbar buttons only when a GIF is loaded.
- Place both buttons to the right of the stop button.
- One button should deduplicate adjacent identical frames by merging the removed frame's duration into the kept frame.
- One button should deduplicate adjacent identical frames by simply dropping the later frame.
- Both actions should compare only adjacent frames.
- Do not remove identical non-adjacent frames if unique frames exist between them.
- Build the feature with test-driven development.
- Add an E2E test.

## Research Findings

- Planning template reviewed: findings.md must be updated after every two view/browser/search operations.
- Planning template reviewed: plan.md uses phased tracking and explicit status updates.
- Questions template reviewed: unresolved questions must be appended chronologically, preserving user answers once given.
- `src/lib/components/Toolbar.svelte` contains the stop button and is the likely insertion point for a conditional deduplicate button.
- `src/lib/components/Toolbar.test.ts` already covers button visibility/disabled states with SSR string assertions.
- `src/lib/stores/frames.svelte.ts` exposes playback and frame-management logic; adjacent-frame deduplication likely belongs there with store-level unit tests.
- Toolbar structure already gates play/stop on `frameStore.hasFrames`, so deduplicate button visibility can reuse the same condition.
- The stop button is rendered in `Toolbar.svelte` with `data-testid="btn-stop"`; the new button should sit immediately after this block to satisfy placement.
- `frameStore` currently owns mutable frame operations (`setFrames`, `deleteFrame`, `reorderFrames`, `clear`), making it the natural home for a `deduplicateAdjacentFrames`-style operation.
- Frame selection is preserved by `selectedFrameId`; deduplication planning must account for what happens if a removed adjacent frame was selected.
- Progress template reviewed: multi-phase work must maintain a running phase log, files touched, test results, and error log.
- E2E coverage lives under `tests/e2e/specs/`, with the main studio workflow in `tests/e2e/specs/studio.ts`.
- `Toolbar.test.ts` uses SSR-only `render(Toolbar)` assertions and `data-testid` checks; deduplicate button visibility/order should be planned in the same style.
- Existing E2E tests keep shared app state across suites in `tests/e2e/specs/studio.ts`, so a deduplication scenario may need either a fresh fixture load or careful sequencing with existing delete/playback tests.
- `src/lib/stores/frames.test.ts` already exercises frame mutation and selection behaviour, giving a natural TDD home for adjacent-deduplication cases.
- Only one E2E fixture is present at `tests/fixtures/test.gif`; a dedicated duplicate-adjacent fixture is likely needed unless that GIF already encodes the required pattern.
- User clarified scope: there should be two deduplication actions, not one, splitting timing-preserving merge behaviour from strict removal behaviour.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Use task name `deduplicate-frames` | Succinct, maps directly to the requested feature |
| Treat this as a multi-phase plan | Expected file count and TDD scope exceed the skill threshold |
| Plan unit coverage in both Toolbar and frame-store tests | UI visibility and deduplication behaviour are split across those responsibilities already |
| Likely add a dedicated E2E fixture | Current visible fixture set does not obviously cover adjacent duplicates |
| Plan two toolbar actions rather than one | User explicitly requested both merge and drop variants |

## Selection reconciliation decision

When `deduplicateAdjacentMerge` or `deduplicateAdjacentDrop` removes a frame that was the active `selectedFrameId`, the store selects `result[0]` (the first remaining frame). This mirrors the simplest recoverable state. `selectedFrameIds` is also reset to a single-element set around the new selection. If the selected frame was not removed, no selection change occurs.

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| None yet | N/A |

## Resources

- /home/kgoe/.copilot/skills/planning/templates/findings.md
- /home/kgoe/.copilot/skills/planning/templates/plan.md
- /home/kgoe/.copilot/skills/planning/templates/questions.md
- /home/kgoe/projects/screeny/src/lib/components/Toolbar.svelte
- /home/kgoe/projects/screeny/src/lib/components/Toolbar.test.ts
- /home/kgoe/projects/screeny/src/lib/stores/frames.svelte.ts
- /home/kgoe/.copilot/skills/planning/templates/progress.md
- /home/kgoe/projects/screeny/tests/e2e/specs/studio.ts
- /home/kgoe/projects/screeny/src/lib/stores/frames.test.ts
- /home/kgoe/projects/screeny/tests/fixtures/test.gif

## Visual/Browser Findings

- Template structure requires explicit plan-size determination before creating the remaining planning files.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
