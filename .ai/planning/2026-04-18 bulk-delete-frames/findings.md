# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: ~4 files modified, estimated ~190 lines of change, and more than 5 tool uses expected across store, component, and test files.

## Requirements

- Shift+Left click a frame in the timeline selects all frames from (inclusive) the currently selected frame to (inclusive) the clicked frame — works in both directions
- Clicking the currently selected frame leaves it selected and clears any range selection
- Regular click selects a single frame (no range)
- Delete button (×) must be visible on all selected frames when the user hovers over *any* one of the selected frames
- Hovering the delete button applies the same hover effect to delete buttons on *all* selected visible frames
- Clicking the delete button on any selected frame deletes *all* selected frames
- Visual-only indicator (no dialog) that all frames will be deleted — see questions.md Q1

## Research Findings

### Codebase

- **`src/lib/stores/frames.svelte.ts`**: Svelte 5 `$state`-based store. Currently tracks `selectedFrameId: string | null` (single selection). Has `selectFrame(id)`, `deleteFrame(id)`, `setFrames()`, `clear()`, `startLoading()`.
- **`src/lib/components/Timeline.svelte`**: Renders `frameStore.frames` in a strip. CSS `.frame-thumb.selected` uses accent border. `.delete-btn` is `opacity: 0` by default, revealed via `.frame-thumb:hover .delete-btn`. Click handler calls `frameStore.selectFrame(frame.id)`.
- **`src/lib/types.ts`**: `Frame { id, imageData, duration, width, height }`. No changes needed.
- **`src/lib/actions.ts`**: File I/O only. No changes needed.
- **Tests**: `frames.test.ts` (comprehensive unit tests), `Timeline.test.ts` (minimal, uses SSR render + `.toContain()` assertions on raw HTML strings).

### UX Research — Bulk Delete Visual Patterns

- **Count badge** on delete button (e.g. `×3`) when >1 frames selected — communicates scope statically, no hover needed
- **Red tint overlay** on all selected frames when delete button is hovered — directly previews which frames disappear (used implicitly in Adobe Premiere style)
- **Opacity fade** on selected items during delete hover — signals "these will disappear"
- Recommended combination: accent border on selected frames (already done) + red tint on all selected frames when any delete button is hovered + count badge on delete button

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Add `selectedFrameIds: Set<string>` to store | Cleanly represents multi-select; `selectedFrameId` remains the "anchor" for range logic |
| `shiftSelectFrames(id)` method on store | Encapsulates range-select logic, makes it unit-testable without touching the component |
| `deleteSelectedFrames()` method on store | Single method deletes all selected frames, updates selection cleanly |
| `selectFrame()` clears `selectedFrameIds` | Regular click resets to single selection — prevents stale multi-select |
| CSS class `multi-delete-hover` on `.frames-strip` | Avoids JS hover tracking; `:has(.delete-btn:hover)` or a Svelte state variable drives visibility of all selected delete buttons |
| Red tint via CSS `::after` pseudo-element on `.frame-thumb.selected.deleting` | Pure CSS approach, no DOM additions; class toggled by Svelte hover state |
| Count badge on delete button | Shows `×N` when N > 1 frames selected; always visible on selected frames when hovered |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

- `src/lib/stores/frames.svelte.ts` — store to modify
- `src/lib/components/Timeline.svelte` — component to modify
- `src/lib/stores/frames.test.ts` — store tests to extend
- `src/lib/components/Timeline.test.ts` — component tests to extend

## Visual/Browser Findings

- Research confirms: red tint overlay + count badge is the most established visual pattern for bulk-delete preview in media editors
- Adobe Premiere-style: selected items highlight in danger colour when delete action is targeted
- Smashing Magazine and GitLab design system both recommend immediate colour feedback (no dialog) for destructive batch actions

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
