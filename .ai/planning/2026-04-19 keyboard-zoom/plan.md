# Task Plan: Keyboard/Mouse Support & Zoom Indicator

## Goal

Add keyboard navigation (arrow keys, Page Up/Down, Delete, Space, Shift+arrows), mouse zoom/pan (Ctrl+wheel, right-drag/Shift+left-drag), persistent zoom/pan across frame changes, and a zoom level indicator with reset button to the Studio view.

## Current Phase

Phase 1

## Phases

### Phase 1: Frame store navigation methods (TDD)

Add selection navigation and playback toggle methods to the frame store, driven by unit tests.

- [ ] Use `tdd` skill throughout
- [ ] Write failing tests for `selectNextFrame()` — moves selection to next frame, clamps at end, no-op when no frames
- [ ] Implement `selectNextFrame()`
- [ ] Write failing tests for `selectPreviousFrame()` — moves selection to previous frame, clamps at start
- [ ] Implement `selectPreviousFrame()`
- [ ] Write failing tests for `extendSelectionRight()` — adds next frame to `selectedFrameIds`, moves `selectedFrameId` anchor right
- [ ] Implement `extendSelectionRight()`
- [ ] Write failing tests for `extendSelectionLeft()` — adds previous frame to `selectedFrameIds`, moves anchor left
- [ ] Implement `extendSelectionLeft()`
- [ ] Write failing tests for `togglePlayback()` — calls `play()` if stopped, `stop()` if playing
- [ ] Implement `togglePlayback()`
- [ ] Run all unit tests to confirm green
- [ ] Update planning files per `planning` skill
- **Status:** pending

### Phase 2: Keyboard shortcut wiring

Wire global keyboard event handlers to the new store methods and existing actions.

- [ ] In `Timeline.svelte`, expand the existing `handleWindowKeyDown` to handle:
  - `ArrowLeft` → `frameStore.selectPreviousFrame()` (only if `frameStore.hasFrames`, prevent default)
  - `ArrowRight` → `frameStore.selectNextFrame()` (only if `frameStore.hasFrames`, prevent default)
  - `Shift+ArrowLeft` → `frameStore.extendSelectionLeft()` (prevent default)
  - `Shift+ArrowRight` → `frameStore.extendSelectionRight()` (prevent default)
  - `Delete` → `frameStore.deleteSelectedFrames()` (only if not in INPUT/TEXTAREA)
  - `Space` → `frameStore.togglePlayback()` (only if `frameStore.hasFrames` and not in INPUT/TEXTAREA, prevent default)
  - `PageUp` → scroll timeline left by ~300px (need ref to `.timeline` element)
  - `PageDown` → scroll timeline right by ~300px
- [ ] Ensure existing Ctrl+A still works
- [ ] Ensure no conflicts with browser defaults (prevent default where needed)
- [ ] Ensure selected frame is scrolled into view in timeline when navigating with arrow keys
- [ ] Update planning files per `planning` skill
- **Status:** pending

### Phase 3: Zoom and pan in FrameViewer (TDD for logic)

Implement Ctrl+wheel zoom, right-click/Shift+left-click pan, and persistent zoom/pan state.

- [ ] Use `tdd` skill throughout
- [ ] Add component state to `FrameViewer.svelte`: `scale` (number, default 1), `panX` (number, default 0), `panY` (number, default 0)
- [ ] Apply CSS `transform: scale(${scale}) translate(${panX}px, ${panY}px)` to canvas
- [ ] Set `transform-origin: center center` on canvas
- [ ] Remove `max-width: 100%; max-height: 100%` constraints when zoomed (so zoomed image can overflow)
- [ ] Handle `wheel` event on `.viewer`: if Ctrl held, adjust `scale` (zoom in/out, 0.1–10x). **Cursor-centred zoom**: adjust `panX`/`panY` so the point under the cursor stays fixed. Use `event.deltaY` direction. Prevent default to avoid page scroll.
- [ ] Handle `pointerdown` on `.viewer`: if right button (button === 2) or (Shift + left button), start pan mode. Track pointer movement, update `panX`/`panY`. Suppress context menu for right-click.
- [ ] Handle `pointermove` and `pointerup` for pan drag
- [ ] Ensure zoom/pan state persists across frame changes (don't reset in `$effect`)
- [ ] Expose `scale`, `panX`, `panY`, and `resetView()` method as bindable props or via a callback so ZoomIndicator can read/control them
- [ ] Add `data-testid` attributes for E2E testing
- [ ] Update planning files per `planning` skill
- **Status:** pending

### Phase 4: Zoom indicator component (TDD)

Create the `ZoomIndicator.svelte` component.

- [ ] Use `tdd` skill throughout — write SSR render tests for the component
- [ ] Create `src/lib/components/ZoomIndicator.svelte`
- [ ] Props: `scale` (number), `isModified` (boolean — true when scale ≠ 1 or pan ≠ 0,0), `onReset` (callback), `visible` (boolean)
- [ ] Display: magnifying glass icon + `${Math.round(scale * 100)}%` text
- [ ] Show reset button/icon only when `isModified` is true
- [ ] Styling:
  - Position: absolute, top-right of `.viewer-area`, with 10px gap from top and right
  - Background: `var(--color-bg-elevated)`
  - Border: `1px solid var(--color-border)`
  - Border-radius: 4px (match other UI elements)
  - `z-index: 20` (above canvas content, below dialogs)
  - Font-size: 12px, `var(--color-text)` colour
  - Padding: 4px 8px
- [ ] SVG icons: inline, 14x14 or 16x16, `fill="currentColor"`, `aria-hidden="true"`
  - Magnifying glass: circle + diagonal line
  - Reset: circular arrow or crosshair-reset icon
- [ ] Wire into `FrameViewer.svelte` or `+page.svelte` — render inside `.viewer-area`
- [ ] Only show when `frameStore.hasFrames` is true
- [ ] `data-testid="zoom-indicator"`, `data-testid="zoom-level"`, `data-testid="zoom-reset"`
- [ ] Update planning files per `planning` skill
- **Status:** pending

### Phase 5: E2E tests

Write E2E tests covering the new keyboard and zoom features.

- [ ] Add test suite "Keyboard Navigation" in `tests/e2e/specs/studio.ts`:
  - Arrow keys move selection left/right
  - Shift+arrow keys extend selection
  - Delete removes selected frames
  - Space toggles playback
  - Page Up/Down scrolls timeline
- [ ] Add test suite "Zoom & Pan":
  - Ctrl+wheel zooms in/out (check zoom indicator shows updated percentage)
  - Zoom indicator visible when GIF loaded, hidden when not
  - Reset button appears when zoomed, clicking it resets to 100%
  - Zoom persists across frame changes (zoom in, navigate to next frame, check zoom indicator still shows same level)
- [ ] Use `browser.execute()` to dispatch keyboard and wheel events
- [ ] Follow existing test patterns (`jsClick`, `data-testid` selectors, `browser.pause`)
- [ ] Update planning files per `planning` skill
- **Status:** pending

### Phase 6: Final verification & planning cleanup

- [ ] Run full unit test suite (`pnpm test:unit`)
- [ ] Verify all keyboard shortcuts work as specified
- [ ] Update all planning files to final state per `planning` skill
- **Status:** pending

## Key Questions

1. ~~Should arrow key navigation wrap around or clamp?~~ — **Confirmed: clamp** (user approved)
2. Should Delete key work globally or only when timeline/frame is focused? — **Assumption: globally** when frames are loaded, matching Ctrl+A's global scope. Guard against INPUT/TEXTAREA focus.
3. Zoom step size per wheel tick? — **Assumption: ×1.1 per tick** (10% incremental, smooth feel)
4. Zoom limits? — **Assumption: min 0.1× (10%), max 10× (1000%)**
5. ~~Should Shift+Arrow extend from anchor or selection edge?~~ — **Confirmed: selection edge** (user approved)
6. ~~Zoom centre point: cursor or viewer centre?~~ — **Confirmed: cursor-centred** (user approved)
7. ~~Auto-scroll timeline on arrow key navigation?~~ — **Confirmed: yes** (user approved)

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| CSS transform for zoom/pan | Simpler than canvas redraw; preserves `image-rendering: pixelated`; no perf cost |
| Zoom/pan as FrameViewer component state | View concern, not model. Persists across frame changes within same component lifecycle |
| Centralise new shortcuts in existing Timeline keydown handler | Consistent with Ctrl+A; window-level scope already set up |
| Clamp (not wrap) for arrow navigation | Confirmed by user; conventional in editors |
| ZoomIndicator as separate component | Clean separation, testable via SSR |
| 10% zoom steps (×1.1 per tick) | Smooth, predictable zoom feel |
| Cursor-centred zoom | Confirmed by user; Figma/Photoshop-style, zoom towards cursor position |
| Extend selection from edge of range | Confirmed by user; standard file-manager behaviour |
| Auto-scroll timeline on arrow nav | Confirmed by user; use `scrollIntoView()` on selected frame thumb |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| (none yet) | | |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors — they help avoid repetition
- Use `tdd` skill for all implementation phases
- Follow `java-test-conventions` → N/A (TypeScript project)
- Follow existing inline SVG icon pattern (16x16, `fill="currentColor"`, `aria-hidden="true"`)
