# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: 6+ files to create/modify, ~400+ lines of new code across store methods, component, tests, and E2E.

## Requirements (Phase 6 additions)

- Ctrl+I keyboard shortcut to toggle inspector minimised/expanded
- Duration input spin buttons styled consistently with app buttons (removed native; wheel increment still works)
- Toggle button right-aligned in the inspector footer (not centred), so the same click target works in both states
- Frame indicator text ("Frame x of y" / "Frames x - y of z") in all caps
- More spacing between inspector body elements (except title)
- Duplicate and delete buttons: equal width, filling the full panel width
- Fix drag-and-drop overlay overlapping inspector panel (Option 1: dynamic right margin)
- Fix Shift+scroll bug: WebKit converts Shift+vertical-scroll to horizontal (deltaY=0, deltaX≠0); fix by falling back to deltaX

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

### Phase 6 research findings

**Shift+scroll bug root cause:**
`handleDurationWheel` uses `event.deltaY < 0 ? 100 : -100` for Shift+scroll. On WebKit (Tauri on Linux), holding Shift while scrolling converts the vertical scroll to horizontal: `deltaY` becomes `0` and `deltaX` becomes non-zero. With `deltaY = 0`, `0 < 0` is always `false`, so the delta is always `-100` regardless of scroll direction. Result: `current + (-100)` for a frame with duration ≤ 100 clamps to 1. Fix: `const scroll = event.deltaY !== 0 ? event.deltaY : event.deltaX; if (scroll === 0) return;` then use `scroll` in the direction check.

**Keyboard shortcut pattern (Ctrl+I):**
`Timeline.svelte` uses `$effect(() => { window.addEventListener("keydown", handler); return () => window.removeEventListener(...) })`. Source inspection tests in `Timeline.test.ts` verify this by reading the source file. Same pattern will be used in `+page.svelte`. New file `src/routes/+page.test.ts` will hold source inspection tests for Ctrl+I.

**Toggle button alignment:**
Currently `.inspector-footer` has `justify-content: center`. Both expanded (240px) and minimised (32px) panels share the same `right: 8px` anchor. Changing to `justify-content: flex-end` means the button always sits at the right edge of the panel — which is always the same pixel position from the viewport's right edge (right: 8px + 4px padding = right edge at 12px from viewport). This makes the toggle button a stable click target.

**Drop overlay overlap:**
`.drop-overlay` uses `inset: 0; margin: 8px` making it fill the full viewer-area. The inspector sits at `right: 8px` with width 240px/32px. Applying `style:margin-right="{dropOverlayRightMargin}px"` overrides the CSS `margin-right: 8px` shorthand. Values: minimised = 8+32+8 = 48px, expanded = 8+240+8 = 256px. `inspectorMinimised` is already tracked in `+page.svelte` via `$bindable()` bind.

**CSS-only changes (no unit test equivalent):**
SSR tests check HTML strings, not CSS properties. These changes are verified via E2E tests only:
- `text-transform: uppercase` on `.frame-indicator`
- `gap: 24px` on `.inspector-body`
- `justify-content: flex-end` on `.inspector-footer`
- `flex: 1` on `.action-buttons button`
- `appearance: textfield` + `::-webkit-inner-spin-button { display: none }` on duration input

**Existing E2E test that needs updating:**
`expect(indicator).toHaveText("Frame 1 of 2")` — WebdriverIO `getText()` returns CSS-transformed text, so this assertion will need to become `"FRAME 1 OF 2"` once text-transform is applied. Same for `"Frames 1 - 2 of 2"` → `"FRAMES 1 - 2 OF 2"`.

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
| Shift+scroll fix: fallback to `deltaX` | WebKit sends `deltaY=0, deltaX≠0` on Shift+scroll; `deltaX` carries the direction |
| Toggle footer `justify-content: flex-end` | Right-aligns toggle button so its position is stable (same absolute px) across both minimised and expanded states |
| Frame indicator uppercase via CSS `text-transform` | Consistent with `.inspector-title`; HTML unchanged so SSR unit tests still pass |
| Inspector body gap: 12px → 24px | Doubles element spacing per user request |
| Action buttons `flex: 1` | Each button fills half the panel width equally |
| Input spinners removed (`appearance: textfield`) | Native spinners look out of place; mouse wheel handles increment/decrement |
| Ctrl+I in `+page.svelte` `$effect` | Global shortcut, not component-scoped; follows Timeline.svelte pattern |
| Drop overlay Option 1 (dynamic right margin) | `inspectorMinimised` already in `+page.svelte`; `$derived` margin is minimal change |
| Drop overlay margins: 48px / 256px | 8px outer gap + panel width + 8px inner gap; matches inspector's spatial footprint |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |

## Resources

- `src/routes/+page.svelte` — main layout, where Inspector will be integrated
- `src/lib/stores/frames.svelte.ts` — frame store, needs new methods
- `src/lib/components/ZoomIndicator.svelte` — reference for small component pattern
- `src/lib/components/Toolbar.svelte` — has existing dedup buttons to reference
