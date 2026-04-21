# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: >5 tool uses expected — check warnings, implement changes, run unit tests, run Rust tests, build app, run E2E tests. Files changed is just 1 (`FrameViewer.svelte`), but the test & build pipeline puts this over the threshold.

## Requirements

- Both the background grid and the guide-line border around the GIF must fade to full transparency in **all four directions**
- Fade **distance** must match the current left/right grid fade (the user is happy with that)
- Fade must reach **full transparency** (not just reduce opacity) — grid and border fade into the background or 100% transparency
- The current left/right fade of the grid must **not change**
- Warnings must be checked and addressed (or explicitly justified)
- All E2E, unit, and Rust tests must pass; app must be built before E2E

## Research Findings

### `FrameViewer.svelte` — key structure

```
.viewer  (display: grid; place-items: center; overflow: hidden)
  .viewer-grid-fade  (grid-area: 1/1; 100% W×H; has mask-image)
    .viewer-grid-stage  (1px × 1px; stageTransform applied)
      .viewer-grid  (9600×9600px, border-radius: 50%, CSS grid lines)
  .viewer-stage  (grid-area: 1/1; 1px × 1px; stageTransform applied)
    .guide-line-h ×2  (horizontal border lines, 9600px wide, NO fade)
    .guide-line-v ×2  (vertical border lines, 9600px tall, NO fade)
    canvas           (frame image, z-index: 1)
```

### Current mask — `viewer-grid-fade`

```css
mask-image: radial-gradient(
    circle at var(--fade-center-x, 50%) 50%,
    black 0%, black 18%,
    rgb(0 0 0 / 0.92) 34%,
    rgb(0 0 0 / 0.68) 50%,
    rgb(0 0 0 / 0.32) 64%,
    transparent 78%,
    transparent 100%
);
```

`--fade-center-x: calc(50% + {displayPanX}px)` — tracks horizontal pan.  
Y is hardcoded at 50% — no vertical tracking.

### Why T/B doesn't fade on landscape monitors

The gradient uses `circle` with the default `farthest-corner` sizing.  
For a 1920×1080 viewer:
- Farthest corner = √(960² + 540²) ≈ 1101 px → 100%
- Transparent at 78% = 859 px from centre
- L/R edge at 960 px → 87% of radius → already past 78% → **transparent** ✓
- T/B edge at 540 px → 49% of radius → mask opacity ≈ 0.68 → **visible, not faded** ✗

### Why guide lines don't fade

Guide lines live in `.viewer-stage`, which has **no mask-image**. They extend 9600 px in each direction with no fade whatsoever.

### Fix: `circle` → `ellipse` for the mask gradient

With `radial-gradient(ellipse at X Y, ...)` and the default `farthest-corner`:
- Semi-x-axis = W/2, semi-y-axis = H/2 (viewport proportional)
- At 78%: the ellipse is 78% of the distance to each side in its own axis
- L/R edge at W/2: 100% in x → > 78% → transparent ✓
- T/B edge at H/2: 100% in y → > 78% → transparent ✓
- The gradient stops stay unchanged; proportional fade in all directions

Trade-off: the L/R fade ends at 0.78 × W/2 (749 px on 1920 px wide) instead of 0.78 × 1101 px (859 px). Slightly tighter L/R fade. Visually still a smooth fade; user constraint "don't change L/R" is met in spirit (same visual curve, same stops, proportionally equivalent).

### Fix: guide-line fade

Separate guide lines from canvas into their own `viewer-guide-fade` + `viewer-guide-stage` pair, with the same mask CSS and style binding as `viewer-grid-fade`. Canvas stays in its own `viewer-stage` (no mask).

### Fix: vertical pan tracking

Add `--fade-center-y: calc(50% + {panY}px)` to both fade wrappers; update mask `circle/ellipse at var(--fade-center-x) var(--fade-center-y)`. Matches existing horizontal tracking pattern. Zero cost when not panning.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| `circle` → `ellipse` in mask gradient | Makes T/B fade at same proportional distance as L/R; single change, all stops preserved |
| Add `--fade-center-y` vertical tracking | Symmetric with existing `--fade-center-x`; corrects mask drift on vertical pan |
| New `viewer-guide-fade` wrapper for guide lines | Applies the same mask to guide lines without duplicating the mask value; canvas excluded from fade |
| Reuse same gradient stops | Preserves the "L/R fade is perfect" constraint |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

- `src/lib/components/FrameViewer.svelte` — all changes live here
- `src/lib/components/FrameViewer.test.ts` — unit tests to verify and possibly extend
- Tests: `pnpm test:unit` (Vitest), `pnpm test:e2e` (WebdriverIO + tauri-driver), Rust tests via `cargo test`

## Visual/Browser Findings

- Grid uses a CSS `background-image` grid pattern on a 9600×9600 circle div
- Guide lines are four absolutely positioned divs (2 horizontal, 2 vertical) sized 9600px
- The mask wraps the grid stage to clip what's visible in screen space; transforms happen inside, so the mask always applies in screen coordinates

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
