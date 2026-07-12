# Findings

## Plan Size

**Multi-phase: Yes**

Reasoning: implementation will likely modify more than 5 files (`types.ts`, import normalisation, frame editing/store, Canvas redraw, Inspector UI/styles, unit tests, E2E tests, dependency/lockfile). It will also require more than 5 tool uses and probably over 150 lines of code/test changes.

## Requirements

- Add a colour wheel/picker in the frame inspector to change the solid background colour for imported frames smaller than the existing canvas.
- Multi-select must be supported: selecting one or more frames and applying one colour to the whole selection.
- Multi-select must still work when some selected frames already fill the canvas.
- Research whether to use `svelte-awesome-color-picker` or `huey`.
- Suggest behaviour for frames/images that fill the whole canvas, where the background colour has no visible effect.
- Write an E2E test for the feature.
- Implementation must use the `tdd` skill.
- If modifying/removing existing tests seems needed, ask explicit confirmation in `questions.md` first and list each test with reason.
- Check warnings and address them properly, or explain why not.
- Before E2E tests: build the application.
- Verification required: all E2E tests, all unit tests, all Rust tests.

## Research Findings

- Repository root: `/home/kgoe/projects/screeny`.
- App stack: SvelteKit/Svelte 5 frontend, Tauri 2 Rust shell, Vite, Vitest, WebdriverIO E2E.
- Existing npm scripts: `build`, `check`, `test:unit`, `test:e2e`, `tauri`.
- Current dependencies have no colour picker library; adding one will require `package.json` and lockfile changes.
- Domain glossary: `Frame` currently has id, pixel data, duration, dimensions. `Import` inserts smaller frames centred into existing project dimensions and keeps project bounds as export/crop boundary.
- Likely touch areas: frame type/store/editing, import centring/compositing, canvas rendering, Inspector UI/tests, E2E tests.
- `Frame` has no background colour field today; `ExportFrame` mirrors image data/duration/dimensions only.
- `src/lib/import/importFrames.ts` currently normalises imported frames by filling a new target-sized RGBA buffer with hard-coded opaque black (`BLACK_RGBA`) then copying centred pixels. This bakes the background into `imageData`.
- `frameStore` exposes multi-selection and duration editing via `setFrameDuration(frames, selection, duration)`; analogous background colour editing can fit as `setFrameBackgroundColour(colour)` delegating to timeline editing.
- `renderFrameToCanvas` renders only `frame.imageData`; if background stays baked into image data, colour changes need to regenerate `imageData`. Alternative is to store original/source pixels + background separately, but larger migration.
- `timeline/frameEditing.ts` already has pure multi-select editing operations; `setFrameDuration` is the pattern for applying a scalar value to every selected frame.
- `Inspector.svelte` derives mixed/single duration values from selected frames and has existing bulk-edit affordance. Colour control belongs near duration row, with mixed-state handling analogous to duration.
- `Inspector.test.ts` uses SSR rendering; component tests can verify static colour control/mixed-state markup but not rich browser colour-picker interaction.
- `tests/e2e/specs/inspector.ts` already covers inspector multi-select behaviours; the new E2E can either be appended there or placed in a dedicated spec. Existing tests need not be modified/removed based on current research.
- `importFrames.test.ts` currently asserts opaque black padding. Best path is to add new tests before changing implementation; avoid deleting the existing black-default assertion by preserving black as the default background.
- Existing store duration tests provide a close template for background-colour store tests, including multi-selection and no-op cases.
- E2E helpers include JS value/click/shift-click helpers and can inspect canvas pixels through `browser.execute` on `[data-testid="frame-canvas"]`.
- Existing canvas E2Es verify canvas DOM/test IDs. A colour E2E can load a base fixture, import a smaller/ratio-different fixture, select imported frames, set background, and sample corner pixels.
- `createImportTransaction` normalises imported frames to the selected target frame's dimensions before insertion. That is the point where imported smaller frames receive their default background.
- `Canvas.svelte` redraw effect currently tracks only `selectedFrameId`; if a selected frame's `imageData` changes without changing selection, the canvas may not redraw. Implementation must make redraw depend on the selected frame payload/version while avoiding load-stream redraw regressions.
- Rust encoder consumes already-composited RGBA `ExportFrame.image_data`, width, height, duration. If colour changes rewrite `imageData`, no Rust export change should be needed.
- Rust tests exist under `src-tauri`; final verification should include `cd src-tauri && cargo test`.
- Import E2E already covers mismatched imported `landscape.gif` centred into an 8×8 project, leaving selected frame unchanged after import. New E2E can reuse this pattern, then select imported thumb `frame-thumb-2`.
- Project lifecycle import path creates an import transaction before opening file dialog, buffers decoded frames, then commits normalised frames. No lifecycle redesign appears needed.
- Fixtures: `test.gif` is 8×8, `landscape.gif` is 12×4, `portrait.gif` is 4×12. Importing `landscape.gif` into `test.gif` creates padding above/below after centre crop/copy, suitable for sampling top-left background colour in E2E.
- npm metadata: `svelte-awesome-color-picker` latest observed `4.1.3`, peer `svelte ^5.0.0`, deps `colord`, `svelte-awesome-slider`, unpacked size ~81 KB.
- npm metadata: `@hueycolor/svelte` latest observed `1.0.1`, peer `svelte ^5.0.0`, dep `@hueycolor/core`, unpacked size ~120 KB.
- README test docs: E2E requires a Tauri build first (`pnpm tauri build` per README; user says build before E2E). Unit tests use `pnpm test:unit`; E2E uses `pnpm test:e2e`.
- Store test support currently creates minimal `Frame` objects; adding optional background metadata must keep these helpers/tests simple via optional fields/defaults.
- No project-local `AGENT(S).md` found within max depth 3 beyond the global/project instructions already supplied.
- Created complete multi-phase plan and questions/progress docs. Current git status also shows pre-existing `.ai/next-steps.md` modification and older untracked planning folders unrelated to this plan.
- Planning folder: `.ai/planning/2026-07-12 frame-background-colour-picker/`.
- Planning templates are in `/home/kgoe/.pi/agent/skills/planning/templates`.

## User Responses Processed

- Q1: User confirmed the proposed defaults: `svelte-awesome-color-picker` first, `backgroundColour` plus content bounds metadata, default black padding, picker visible/enabled for full-canvas frames with helper text, and mixed-selection apply-to-all behaviour.
- Q2: User noted the item was not a real question. Treat as processed; no scope change. Safeguard remains: if existing test modification/removal becomes necessary, ask explicitly then.
- Q3: User confirmed Option B for follow-up picker placement: embedded compact picker shown on demand inside the Inspector.

## Follow-up Requirements: Picker Styling and Selection Bug

- User reports the picker popup background is white and visually inconsistent with the app/Inspector dark surface and frame styling.
- Research and propose options with pros/cons: style the popup, embed/toggle the picker inside the Inspector, or overlay it outside Inspector clipping into canvas space.
- User reports the popup is larger than Inspector width/height, creating hidden content and unexpected vertical/side scrolling inside the Inspector.
- Avoid constrained/clipped picker UX; if popup remains, it must overlay above Inspector bounds and open leftwards into canvas space.
- Critical bug: changing selection can alter colours without touching background controls. Repro: select a frame with BG colour 1, then expand selection to frames with another colour; original selected frame immediately changes to newly included frame's colour.
- Plan update requested only; implementation to follow after approval.

## Implementation Findings

- `svelte-awesome-color-picker` installed successfully at `4.1.3`; API supports Svelte 5 default `ColorPicker`, `bind:hex`, `isAlpha={false}`, and `onInput`.
- Import normalisation now records `backgroundColour` and `contentBounds`; default black padding remains unchanged.
- Background colour editing rewrites only pixels outside `contentBounds`; full-canvas frames store the selected colour without changing `imageData`.
- Inspector uses the package picker plus a stable hex input for keyboard/E2E interaction, mixed-selection placeholder, and full-canvas helper copy.
- Canvas redraw now tracks `selectedFrameRevision` so selected-frame image changes repaint while frame lookup remains under `untrack`.
- Verification completed: `pnpm check`, `pnpm test:unit`, `cd src-tauri && cargo test`, `pnpm tauri build`, and `pnpm test:e2e` all passed.

## Follow-up Research Findings

- Current `Inspector.svelte` keeps `<ColorPicker>` always rendered inside `.background-colour-picker` within `.inspector-body`, which has `overflow-y: auto`; this explains picker content being constrained by the Inspector scroll area.
- Current selection bug likely comes from `$effect(() => { pickerHex = backgroundColourValue || "#000000"; })` combined with `<ColorPicker bind:hex={pickerHex}>`; when selection changes, `pickerHex` changes, and the picker may emit `onInput`, calling `frameStore.setFrameBackgroundColour` even though the user did not interact with colour controls.
- `svelte-awesome-color-picker` default wrapper uses `background-color: var(--cp-bg-color, white)`, so the white popup can likely be themed via CSS custom properties rather than library fork.
- The package supports `position='fixed' | 'responsive' | 'responsive-x' | 'responsive-y'` and `isDialog={false}`. `isDialog={false}` makes the picker always visible/relative; `position` only applies to dialog popup mode.
- Package default wrapper styles: `padding: 8px`, `background-color: var(--cp-bg-color, white)`, `border: 1px solid var(--cp-border-color, black)`, `border-radius: 12px`, `width: max-content`; dialog wrapper is `position: absolute`, `top: calc(var(--input-size, 25px) + 12px)`, `left: 0`.
- Responsive positioning can move the popup above/below or left/right based on viewport, but because it remains absolute inside the Inspector DOM, it is still affected by the Inspector/Inspector body overflow/clipping behaviour.
- `isDialog={false}` removes the package input and renders the wrapper relatively/inline and always open, which is easier to reason about than fighting popup placement, but it still needs sizing/layout work inside the narrow Inspector.
- Picker square defaults to `--picker-width: 200px` and `--picker-height: 200px`; with wrapper padding/margins/hue slider, the default control is effectively close to or wider than the 240px Inspector, explaining poor fit.
- Picker dimensions are CSS-variable driven (`--picker-width`, `--picker-height`, `--slider-width`, etc.), so an embedded Inspector version can be reduced to fit the Inspector width without changing library source.
- The package has no portal support in the installed build; robust overlay outside Inspector clipping would likely require app-owned positioning/wrapper work or moving the picker DOM outside `.inspector-body`.

## Follow-up Options

### Option A: Theme existing popup in place

Pros:
- Smallest code change: set package CSS variables such as `--cp-bg-color`, `--cp-border-color`, `--cp-text-color`, `--picker-z-index`.
- Keeps current package dialog behaviour and keyboard semantics.

Cons:
- Does not inherently solve clipping/hidden content because popup remains absolute inside the Inspector/scrolling body.
- May still create unexpected Inspector scrolling.
- Least likely to satisfy requirement 2 without additional layout changes.

### Option B: Embedded compact picker in Inspector (recommended)

Pros:
- Easiest robust path: package supports `isDialog={false}` and CSS-variable sizing, so no portal/fork needed.
- Solves white background by theming the embedded surface to Inspector variables.
- Avoids overlay clipping and side scrolling by constraining `--picker-width`/`--picker-height` to the Inspector width.
- More predictable tests: picker is normal Inspector content, visible after click/toggle.

Cons:
- Uses vertical Inspector space; must keep it compact and only show on demand.
- Needs explicit open/closed state and accessibility handling.
- If future Inspector grows, may still need layout tuning.

### Option C: App-owned overlay/portal opening left into canvas

Pros:
- Preserves popup feel without consuming Inspector space.
- Can open left into canvas and avoid Inspector clipping if DOM is moved outside `.inspector-body`.
- Can keep larger picker dimensions.

Cons:
- Most complex: custom positioning, z-index, outside-click, Escape, focus, resize/scroll handling.
- Package has no built-in portal support, so app must own the hard part.
- More brittle E2E due absolute positioning and viewport dependencies.

Recommendation: implement Option B. User confirmed this in Q3. It is easier than Option C and more complete than Option A.
- Package install emitted informational pnpm update/deprecated-transitive warnings; no Svelte/TypeScript warnings remained.

## Follow-up Implementation Findings

- Removed two-way `bind:hex` wiring from `Inspector.svelte`; picker state no longer commits selection-derived colour changes.
- Selection changes now close the embedded picker and reset picker user-input state, preventing package `onInput` emissions from mutating frame data.
- Picker commits are gated by user-originated pointer/keyboard interaction inside the picker; text input edits still commit directly.
- Added a regression E2E that colours an imported padded frame, expands selection across a full-canvas frame, and asserts the imported thumbnail padding remains unchanged.
- Implemented Option B: compact embedded picker opens from the background input/toggle, uses `isDialog={false}`, disables package text/alpha controls, and inherits app dark theme variables.
- Added E2E coverage that verifies picker bounds, no horizontal overflow, and wrapper surface/border matching the Inspector.
- Picker resize polish sets the colour picker to horizontal slider layout, makes the picker frame full-width to match the background hex field, and makes Show/Hide picker full-width with dedupe-button dimensions.
- Verification passed after follow-up changes: `pnpm check`, `pnpm test:unit`, `cd src-tauri && cargo test`, `pnpm tauri build`, and full E2E. Picker resize focused verification also passed: `pnpm check`, Inspector unit, Tauri build, and Inspector E2E.

## Recommendation

Implemented with `svelte-awesome-color-picker`. Rationale: it is a complete Svelte 5 colour picker component with TypeScript, accessibility/keyboard support, fallback native input, smaller package metadata than Huey, and faster integration for this inspector feature. Huey remains unnecessary.

Represent frame background as metadata plus baked RGBA output:

- Add optional frame background metadata, e.g. `backgroundColour` (`#rrggbb`) and `contentBounds` for the pixels copied from the imported source.
- Keep the current default `#000000` for imported padding so existing behaviour and tests remain valid.
- Recolour by filling only pixels outside `contentBounds` and leaving content pixels untouched.
- Full-canvas frames use content bounds equal to the whole canvas, so recolouring is a no-op visually but can still update the stored selected value.

Full-canvas UX recommendation:

- Show the colour picker in the frame inspector for every selected frame for consistency and predictable bulk edit.
- If every selected frame fills the canvas, keep the control enabled but show helper text such as “This frame fills the canvas, so the background colour has no visible effect.”
- If selection is mixed, allow apply to all selected frames; padded frames change visibly, full-canvas frames participate without breaking the operation. This satisfies the strong multi-select requirement.

## Resources

- Candidate library: https://github.com/Ennoriel/svelte-awesome-color-picker
- Candidate library: https://github.com/hueycolor/huey
- `svelte-awesome-color-picker` docs: https://svelte-awesome-color-picker.vercel.app/
- Huey docs: https://hueycolor.pages.dev
- Planning skill template read: `/home/kgoe/.pi/agent/skills/planning/templates/findings.md`
- Planning skill template read: `/home/kgoe/.pi/agent/skills/planning/templates/plan.md`
- Planning skill template read: `/home/kgoe/.pi/agent/skills/planning/templates/questions.md`
- Planning skill template read: `/home/kgoe/.pi/agent/skills/planning/templates/progress.md`
- Relevant skill read: `tdd`.

## Visual/Browser Findings

- Search result for `svelte-awesome-color-picker`: v4 exists, rewritten for Svelte 5, latest npm version shown as 4.0.2, documented as highly customisable, keyboard/mobile/accessibility support. Good fit for this Svelte 5 app.
- Search result for `huey`: direct `github.com/hueycolor/huey` did not surface as a specific package/docs result in top search; results were less directly actionable than `svelte-awesome-color-picker`.
- Fetched `svelte-awesome-color-picker`: package provides Svelte `ColorPicker.svelte`, `Picker.svelte`, TypeScript support, fallback native colour picker, keyboard navigation, accessibility information, mobile support; v4 targets Svelte 5.
- Fetched Huey: monorepo with `@hueycolor/svelte` for Svelte 5; offers composable primitives (`huey-root`, `hex-input`, `saturation-area`, sliders, swatches, etc.), accessible keyboard/ARIA support, minimal styling and high customisability.
- Attempt to fetch usage-specific `svelte-awesome-color-picker` docs with query returned no relevant extracted content.
- Attempt to fetch Huey package subpath was blocked by URL approval rules; use root README findings plus package metadata unless further docs are required.
- Additional search for `svelte-awesome-color-picker` usage still points to official docs/npm/GitHub, but snippets do not expose concrete API details.
- Additional search for `@hueycolor/svelte` usage produced weak results; root README confirms package but implementation planning should verify exact API by installing/reading package types during TDD phase.
