# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: 6+ files to create/modify, ~400+ lines of new code across store methods, component, tests, and E2E.

## Requirements (Phase 5 additions)

- Inspector panel must be **floating**: rounded corners, gap of 8px from top toolbar, right edge of window, and bottom timeline
- ZoomIndicator must always sit 20px to the left of the inspector panel, whether it is expanded (240px) or minimised (32px)
- Toggle button (minimise/restore) must always be at the **bottom** of the inspector, in both expanded and minimised states
- Toggle button must use SVG icons (sidebar collapse/expand standard), not text arrows
- Bulk edit tag must be only as wide as its text content (not 100% of panel width)
- Duration section: label "Duration:" and the editable field and "ms" unit must all be on **one row** that stretches to 100% of the panel width
- All unit, E2E, and Rust tests must pass (no regression)

## Original Requirements

- Inspector side panel on the right of the viewer area
- When no GIF loaded: panel visible, shows "No frame selected"
- Title: "Inspector"
- Frame indicator: "Frame x of z" (single) or "Frames x - y of z" (multi-select)
- "Bulk edit" tag when multiple frames selected
- Duration control section:
  - Shows current duration value
  - Unit "ms" shown but not editable
  - User can type a number (1–9999)
  - Mouse wheel: +/- 1 per tick; Shift+wheel: +/- 100
- Dedup buttons (merge & drop) shown only when multiple frames selected
  - These already exist in the toolbar; inspector buttons call the same store methods
  - Store methods already handle selection-scoped dedup when `selectedFrameIds.size > 1`
- Action buttons row:
  - Duplicate icon: duplicates selected frame(s), inserts after current selection
  - Delete (bin) icon: deletes selected frame(s)
- Minimise/restore toggle (bottom-right):
  - "->|" button minimises panel (slides right, leaving only the restore button)
  - "|<-" button restores panel
- Implementation must follow TDD skill
- E2E test required
- All unit, E2E, and Rust tests must pass (no regression)

## Research Findings

### Existing store capabilities

- `frameStore.selectedFrameId` — anchor of selection (string | null)
- `frameStore.selectedFrameIds` — ReadonlySet<string> of all selected frames
- `frameStore.selectedFrame` — the Frame object for the anchor
- `frameStore.frames` — full Frame[] array
- `frameStore.deleteSelectedFrames()` — already exists
- `frameStore.deduplicateAdjacentMerge()` / `deduplicateAdjacentDrop()` — already handle selection scope
- Missing: `setFrameDuration()` — need to add
- Missing: `duplicateSelectedFrames()` — need to add

### Existing component patterns

- SSR-only unit tests using `render()` from `svelte/server`, asserting on HTML string with `.toContain()`
- Components use `data-testid` for test element selection
- Theme uses CSS custom properties defined in `theme.css`
- Page layout: flex column (`app`) → Toolbar, viewer-area (flex: 1), Timeline
- The inspector panel should be placed inside `.viewer-area` alongside `FrameViewer`, as a flex sibling

### Layout integration plan

Current `.viewer-area` is `position: relative; flex: 1; display: flex;`. The `FrameViewer` is the only flex child (the overlay elements are absolute-positioned). Adding `Inspector` as a second flex child to the right is straightforward — `FrameViewer` keeps `flex: 1` and `Inspector` gets a fixed width.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| ~~Inspector lives inside `.viewer-area` as a flex sibling~~ → `position: absolute` | Floating panel with gaps requires absolute positioning; FrameViewer fills all space |
| Inspector is a standalone component (`Inspector.svelte`) | Keeps page.svelte clean; inspector logic is self-contained |
| New store methods: `setFrameDuration`, `duplicateSelectedFrames` | Store owns all frame mutations; inspector calls store |
| ~~Minimise state lives in Inspector (local)~~ → `$bindable()` prop | Parent needs to know state to offset ZoomIndicator |
| Duration input uses `<input type="number">` with `min=1 max=9999` | Native numeric input, wheel events handled manually |
| Mixed durations → empty value + "Mixed" placeholder | Standard HTML placeholder clears on focus; no special JS needed |
| Inspector expanded width: 240px | User preference |
| Inspector minimised width: 32px | Just enough for the 24px SVG button with 4px padding |
| Duplicate IDs via `crypto.randomUUID()` | IDs are frontend-only — stripped during export (`actions.ts:71-74`) |
| ZoomIndicator `rightOffset` prop | Keeps it 20px left of inspector regardless of state |
| Single toggle button with dynamic `data-testid` | `data-testid` switches `inspector-minimise` ↔ `inspector-restore` — existing tests still pass |
| Bulk edit tag: `align-self: flex-start` | Flex column stretches children by default; override prevents 100% width |
| Duration row: label + input + unit on one line, input `flex: 1` | User requirement; natural CSS flex layout |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |

## Resources

- `src/routes/+page.svelte` — main layout, where Inspector will be integrated
- `src/lib/stores/frames.svelte.ts` — frame store, needs new methods
- `src/lib/components/ZoomIndicator.svelte` — reference for small component pattern
- `src/lib/components/Toolbar.svelte` — has existing dedup buttons to reference
