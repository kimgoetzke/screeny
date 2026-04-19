# Findings & Decisions

## Plan Size

**Multi-phase: Yes**

Reasoning: ~8 files will be modified/created, estimated 500+ lines of change across store logic, FrameViewer component, Timeline component, new ZoomIndicator component, unit tests, and E2E tests. Multiple distinct feature areas (keyboard navigation, zoom/pan, zoom indicator UI).

## Requirements

From user request:

### Keyboard shortcuts (retain existing + add new)
- **Retain**: Ctrl+A → select all frames
- **Left/Right arrows** → move current frame selection left/right (only when GIF loaded)
- **Page Up/Down** → scroll timeline left/right
- **Delete** → remove current selection (already on focused frame thumbs; needs global scope)
- **Shift+Left/Right** → expand/reduce frame selection towards left/right
- **Space** → toggle playback (play if stopped, stop if playing)

### Mouse/zoom interactions
- **Ctrl+mouse wheel** → zoom in/out the current frame in main section
- **Right mouse button drag** or **Shift+left mouse button drag** → pan/move image around main viewer
- **Persist zoom/pan across frame changes** — changing frame must NOT reset zoom/pan

### Zoom indicator UI
- Small number at top-right of main section showing current zoom level (e.g. "150%")
- Only visible when GIF is loaded
- 10px gap from toolbar edge and right side of window
- Same background as timeline (`var(--color-bg-elevated)`) with same border style (`1px solid var(--color-border)`)
- Must overlay on top of zoomed-in GIF content (high z-index)
- Shows "reset" button/icon when zoom ≠ 100% or pan ≠ (0,0)
- Use magnifying glass icon + reset icon (inline SVG, matching existing icon pattern)

### Testing
- TDD approach using `tdd` skill
- Unit tests for all store logic
- E2E test for keyboard/zoom features

## Research Findings

### Current keyboard handling
- `Timeline.svelte` lines 99-117: window-level `keydown` listener for Ctrl+A only
- `Timeline.svelte` line 154-157: component-level Delete/Enter/Space on focused `.frame-thumb` elements
- No centralised hotkey system — all ad-hoc

### Canvas rendering (FrameViewer.svelte)
- Canvas sized to `img.naturalWidth/Height` — always 1:1
- Parent `.viewer` centres via flexbox, constrains via `max-width: 100%; max-height: 100%`
- No zoom/pan/transform logic exists
- `image-rendering: pixelated` set on canvas

### Frame store state
- `selectedFrameId` (string|null) — anchor for shift-select
- `selectedFrameIds` (Set<string>) — multi-selection set
- `isPlaying` (boolean) — playback state
- `selectFrame(id)` — single select
- `shiftSelectFrames(id)` — range select from anchor to target
- `deleteSelectedFrames()` — delete all selected
- `play()` / `stop()` — playback control

### Missing store methods needed
- `selectNextFrame()` — move selection right
- `selectPreviousFrame()` — move selection left
- `extendSelectionRight()` — Shift+Right
- `extendSelectionLeft()` — Shift+Left
- `togglePlayback()` — Space key

### Zoom/pan approach
- CSS `transform: scale() translate()` on the canvas element is simplest
- Alternative: manipulate canvas drawing coordinates — more complex, no benefit
- CSS transform preserves `image-rendering: pixelated` and works with pointer events
- Need `transform-origin: center center` and track `scale`, `panX`, `panY`
- These values should live in FrameViewer component state (not frame store — they're view state, not model state)
- BUT they must persist across frame changes → component-level `$state` that doesn't reset on frame change

### Timeline scrolling
- `.timeline` has `overflow-x: auto` — native scrollbar
- Page Up/Down: programmatically adjust `.timeline.scrollLeft`
- Need ref to timeline container element

### Icon approach
- Existing pattern: inline `<svg>` with `fill="currentColor"`, 16x16 viewBox, `aria-hidden="true"`
- Magnifying glass: simple SVG path (circle + line)
- Reset: circular arrow or "X" icon

### E2E test patterns
- `jsClick(selector)` for click actions
- `browser.execute()` for dispatching keyboard events
- `data-testid` attributes throughout
- Can dispatch `KeyboardEvent` via `browser.execute()` for keyboard tests
- `browser.pause(ms)` for timing

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Zoom/pan via CSS `transform` on canvas | Simpler than redrawing canvas; preserves `image-rendering: pixelated`; works with pointer events after adjustment |
| Zoom/pan state in FrameViewer component, not store | View-concern, not model — but persists across frame changes via component state |
| Centralise keyboard handling in `+page.svelte` or Timeline | Global shortcuts need window-level listener; keep consistent with existing Ctrl+A pattern |
| New `ZoomIndicator.svelte` component | Clean separation; rendered inside `.viewer-area` with absolute positioning |
| Navigation methods in frame store | `selectNextFrame`, `selectPreviousFrame`, `extendSelectionLeft/Right` are model operations on selection state |
| Arrow keys clamp at boundaries | Confirmed by user — no wrap-around; playback handles wrapping separately |
| Cursor-centred zoom | Confirmed by user — Figma/Photoshop style; adjust pan offset so point under cursor stays fixed during scale change |
| Extend selection from edge of range | Confirmed by user — Shift+Right adds frame after rightmost selected, regardless of anchor position |
| Auto-scroll on arrow navigation | Confirmed by user — use `scrollIntoView()` on the newly selected frame's thumb element |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| (none yet) | |

## Resources

- `src/lib/components/FrameViewer.svelte` — main canvas viewer
- `src/lib/components/Timeline.svelte` — frame timeline + existing keyboard handlers
- `src/lib/stores/frames.svelte.ts` — frame store
- `src/lib/stores/frames.test.ts` — existing unit tests
- `src/lib/theme.css` — design tokens
- `src/routes/+page.svelte` — app layout
- `tests/e2e/specs/studio.ts` — E2E tests
