# Viewer grid edge-alignment options

## Context

`FrameViewer.svelte` currently renders:

- a large centred grid field (`.viewer-grid`, `9600px x 9600px`)
- with fixed `background-size: 32px 32px`
- and `background-position: center center`
- under the same transformed stage as the GIF canvas

That means the GIF and grid stay centred together while zooming/panning, but the grid phase is not chosen to "fit" the GIF bounds.

## Hard constraint

If the grid cell size stays fixed at a square size `s`:

- exact fit on the left and right edges requires `frame.width % s === 0`
- exact fit on the top and bottom edges requires `frame.height % s === 0`

So with a fixed `32px` square grid, **you only get perfect alignment on all four edges when both frame dimensions are multiples of 32**.

That is why "keep 32px, keep square cells, no padding, and fit all four edges exactly" is not always achievable.

## Options

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| 1. Clip the grid to the GIF bounds and add a subtle border | Render the grid only behind the image rectangle instead of across the whole viewer, plus a 1px frame/backplate | Smallest visual change; keeps `32px`; makes the edge mismatch feel intentional | Does **not** mathematically solve exact edge fit; some outer cells stay partial |
| 2. Add a snapped backing board | Put the GIF on a board whose width/height snap up to the next multiple of the cell size; keep the GIF centred inside it | Keeps square `32px` cells; gives exact fit at the board edges; very stable across files | Introduces a small visible margin around the GIF |
| 3. Pick an adaptive square cell size near 32 | Search a bounded range such as `28..36` or `24..40` for a square size that divides both width and height, or minimises remainder | Can give perfect edge fit with no padding; cells stay square | Cell size changes per GIF; some files still will not have a perfect divisor in-range |
| 4. Hybrid: divisor first, otherwise snapped board | Try option 3 first; if no good size exists, fall back to option 2 with `32px` | Best balance of "fits nicely" and visual consistency | Slightly more logic than a single-rule approach |
| 5. Draw the grid in canvas instead of CSS | Replace the CSS repeating background with a drawn grid that is clipped and phased from frame dimensions | Full control over crispness, clipping, major/minor lines, and future editor features | More code and rendering complexity; likely overkill for this problem alone |

## Non-recommended option

### Separate X/Y cell sizes from image fractions

This is the "fit width and height independently" idea.

I would avoid it here. It solves divisibility, but it breaks the visual rule that cells should stay square and close to the current `32px` scale. It will also look inconsistent between files.

## Recommendation

### Best default: option 4

1. Try to find a square cell size close to `32px` that fits both dimensions.
2. If you cannot find one inside a tight band, keep `32px`.
3. When staying at `32px`, place the GIF on a snapped backing board and clip the grid to that board.
4. Add a subtle 1px stroke around the board or image.

Why this is the best trade-off:

- it preserves square cells
- it keeps the visual scale near today's `32px`
- it gives exact-fit results when the dimensions allow it
- it avoids weirdly tiny or large cells when the dimensions do not
- it makes the edge treatment look deliberate instead of accidental

## Sensible bounds

If you try adaptive sizing, I would start with:

- preferred size: `32px`
- safe search band: `28..36`
- wider fallback band: `24..40`

Anything outside that will start to feel visibly different from the current viewer.

## Implementation sketch

The current component already has the needed inputs because `frameStore.selectedFrame` carries `width` and `height`.

Useful values:

- `cellSize`
- `boardWidth`
- `boardHeight`
- `paddingX`
- `paddingY`

For snapped-board mode:

- `boardWidth = ceil(frame.width / cellSize) * cellSize`
- `boardHeight = ceil(frame.height / cellSize) * cellSize`
- `paddingX = boardWidth - frame.width`
- `paddingY = boardHeight - frame.height`

Practical note:

- prefer even candidate cell sizes
- if a remainder would force half-pixel edge placement, bias the extra pixel to one side rather than drawing 1px grid lines on half-pixels

## Low-risk rollout path

1. Start with option 1 if you want the smallest UI change.
2. Move to option 4 if you want the edges to look truly "fitted".
3. Only move to canvas rendering if the viewer later needs richer grid behaviour anyway.

## Code references

- `src/lib/components/FrameViewer.svelte`
- `src/lib/components/FrameViewer.test.ts`
- `tests/e2e/specs/studio.ts`
