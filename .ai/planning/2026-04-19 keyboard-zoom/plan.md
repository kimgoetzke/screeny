# Task Plan: Keyboard/Mouse Support & Zoom Indicator

## Goal

Add keyboard navigation (arrow keys, Page Up/Down, Delete, Space, Shift+arrows), mouse zoom/pan (Ctrl+wheel, right-drag/Shift+left-drag), persistent zoom/pan across frame changes, and a zoom level indicator with reset button to the Studio view.

## Current Phase

Phase 6

## Phases

### Phase 1: Frame store navigation methods (TDD)

Add selection navigation and playback toggle methods to the frame store, driven by unit tests.

- [x] Use `tdd` skill throughout
- [x] Write failing tests for `selectNextFrame()` — moves selection to next frame, clamps at end, no-op when no frames
- [x] Implement `selectNextFrame()`
- [x] Write failing tests for `selectPreviousFrame()` — moves selection to previous frame, clamps at start
- [x] Implement `selectPreviousFrame()`
- [x] Write failing tests for `extendSelectionRight()` — adds next frame to `selectedFrameIds`, moves `selectedFrameId` anchor right
- [x] Implement `extendSelectionRight()`
- [x] Write failing tests for `extendSelectionLeft()` — adds previous frame to `selectedFrameIds`, moves anchor left
- [x] Implement `extendSelectionLeft()`
- [x] Write failing tests for `togglePlayback()` — calls `play()` if stopped, `stop()` if playing
- [x] Implement `togglePlayback()`
- [x] Run all unit tests to confirm green
- [x] Update planning files per `planning` skill
- **Status:** complete

### Phase 2: Keyboard shortcut wiring

Wire global keyboard event handlers to the new store methods and existing actions.

- [x] In `Timeline.svelte`, expand the existing `handleWindowKeyDown` to handle:
  - `ArrowLeft` → `frameStore.selectPreviousFrame()` (only if `frameStore.hasFrames`, prevent default)
  - `ArrowRight` → `frameStore.selectNextFrame()` (only if `frameStore.hasFrames`, prevent default)
  - `Shift+ArrowLeft` → `frameStore.extendSelectionLeft()` (prevent default)
  - `Shift+ArrowRight` → `frameStore.extendSelectionRight()` (prevent default)
  - `Delete` → `frameStore.deleteSelectedFrames()` (only if not in INPUT/TEXTAREA)
  - `Space` → `frameStore.togglePlayback()` (only if `frameStore.hasFrames` and not in INPUT/TEXTAREA, prevent default)
  - `PageUp` → scroll timeline left by ~300px (need ref to `.timeline` element)
  - `PageDown` → scroll timeline right by ~300px
- [x] Ensure existing Ctrl+A still works
- [x] Ensure no conflicts with browser defaults (prevent default where needed)
- [x] Ensure selected frame is scrolled into view in timeline when navigating with arrow keys
- [x] Update planning files per `planning` skill
- **Status:** complete

### Phase 3: Zoom and pan in FrameViewer (TDD for logic)

Implement Ctrl+wheel zoom, right-click/Shift+left-click pan, and persistent zoom/pan state.

- [x] Use `tdd` skill throughout
- [x] Add component state to `FrameViewer.svelte`: `scale` (number, default 1), `panX` (number, default 0), `panY` (number, default 0)
- [x] Apply CSS `transform: scale(${scale}) translate(${panX}px, ${panY}px)` to canvas
- [x] Set `transform-origin: center center` on canvas
- [x] Remove `max-width: 100%; max-height: 100%` constraints when zoomed (so zoomed image can overflow)
- [x] Handle `wheel` event on `.viewer`: if Ctrl held, adjust `scale` (zoom in/out, 0.1–10x). **Cursor-centred zoom**: adjust `panX`/`panY` so the point under the cursor stays fixed. Use `event.deltaY` direction. Prevent default to avoid page scroll.
- [x] Handle `pointerdown` on `.viewer`: if right button (button === 2) or (Shift + left button), start pan mode. Track pointer movement, update `panX`/`panY`. Suppress context menu for right-click.
- [x] Handle `pointermove` and `pointerup` for pan drag
- [x] Ensure zoom/pan state persists across frame changes (don't reset in `$effect`)
- [x] Expose `scale`, `panX`, `panY`, and `resetView()` method as bindable props or via a callback so ZoomIndicator can read/control them
- [x] Add `data-testid` attributes for E2E testing
- [x] Update planning files per `planning` skill
- **Status:** complete

### Phase 4: Zoom indicator component (TDD)

Create the `ZoomIndicator.svelte` component.

- [x] Use `tdd` skill throughout — write SSR render tests for the component
- [x] Create `src/lib/components/ZoomIndicator.svelte`
- [x] Props: `scale` (number), `isModified` (boolean — true when scale ≠ 1 or pan ≠ 0,0), `onReset` (callback), `visible` (boolean)
- [x] Display: magnifying glass icon + `${Math.round(scale * 100)}%` text
- [x] Show reset button/icon only when `isModified` is true
- [x] Styling: absolute, top-right, bg-elevated, border, z-index 20, 12px font, 4px 8px padding
- [x] SVG icons: inline, 14×14, `fill="currentColor"`, `aria-hidden="true"`
- [x] Wire into `+page.svelte` — rendered inside `.viewer-area`; parent holds viewerScale/panX/panY state
- [x] Only show when `frameStore.hasFrames` is true
- [x] `data-testid="zoom-indicator"`, `data-testid="zoom-level"`, `data-testid="zoom-reset"`
- [x] Update planning files per `planning` skill
- **Status:** complete

### Phase 5: E2E tests

Write E2E tests covering the new keyboard and zoom features.

- [x] Add test suite "Keyboard Navigation" in `tests/e2e/specs/studio.ts`:
  - ArrowRight/Left move selection, Shift+ArrowRight extends selection
  - Delete removes selected frames; Space toggles playback on/off
  - Zoom indicator hidden when no GIF; shows 100% when loaded
  - (PageUp/Down scrolling skipped — not meaningful with 2–3 frames)
- [x] Add test suite "Zoom & Pan":
  - Ctrl+wheel zooms in and indicator shows >100%
  - Reset button appears when zoomed, clicking it resets to 100% and hides button
  - Zoom persists across frame changes (ArrowRight navigation)
- [x] Use `browser.execute()` to dispatch keyboard and wheel events
- [x] Added `dispatchKey()` and `ctrlWheel()` helpers following existing patterns
- [x] Follow existing test patterns (`jsClick`, `data-testid` selectors, `browser.pause`)
- [x] Update planning files per `planning` skill
- **Status:** complete

### Phase 6: Final verification & planning cleanup

- [x] Run full unit test suite (`pnpm test:unit`) — 181/181 pass
- [x] Verify all keyboard shortcuts work as specified
- [x] Update all planning files to final state per `planning` skill
- **Status:** complete

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
