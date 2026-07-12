# Plan: Frame Background Colour Picker

## Goal

Add a frame-inspector colour picker that changes imported-frame padding background colour for single and multi-selection, with E2E coverage and full regression verification.

## User Prompt

Research and plan a colour wheel/picker for the frame inspector so users can change the solid background colour used when imported frames are smaller than the existing project bounds. The picker must support bulk editing across selected frames. It must keep working when some selected frames fill the entire canvas. The user suggested `svelte-awesome-color-picker` or Huey. The implementation must use TDD, include an E2E test, avoid modifying/removing existing tests without explicit confirmation, handle warnings properly, build before E2E, and run unit, E2E, and Rust tests.

Approved implementation defaults from `questions.md` Q1:

- Default imported padding remains opaque black (`#000000`).
- Use `svelte-awesome-color-picker` first, with fallback to native `<input type="color">` only if package API/compatibility blocks progress.
- Show the picker for full-canvas frames for consistency; show helper copy when it has no visible effect.
- Full-canvas frames may store the selected colour, but their `imageData` stays visually unchanged because there is no padding area.

## Status

Complete — original implementation plus follow-up selection bug fix, embedded picker UX, and full verification are complete.

## Work

### Phase 1: Dependency/API spike and first failing tests

**WHAT:** Verify chosen picker package API, then create the first RED tests for frame background metadata and import default behaviour.
**WHY:** TDD needs one behaviour at a time, and package API should be confirmed before UI design is locked.

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Re-read `.ai/planning/2026-07-12 frame-background-colour-picker/plan.md` and `findings.md` before deciding exact interfaces.
- [x] Install or inspect `svelte-awesome-color-picker`; verify Svelte 5 usage, exported component names, binding/event API, and TypeScript types.
- [x] If package verification fails, try Huey as the alternative rather than repeating the failing approach.
- [x] RED: add one unit test that imported smaller frames keep default black padding and expose background metadata/content bounds.
- [x] GREEN: add minimal type/normalisation code to pass without changing existing black-default behaviour.
- [x] Run the focused unit test(s) for import normalisation.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 2: Frame editing/store behaviour via TDD

**WHAT:** Add pure frame background editing and store methods, including multi-select and full-canvas no-op behaviour.
**WHY:** The Inspector should delegate mutation to the same pure-edit/store pattern as duration edits.

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Re-read the plan before choosing exact function names/data shape.
- [x] RED: add a test for changing one padded frame's background colour, asserting only padding pixels change.
- [x] GREEN: implement minimal recolour helper and pure `setFrameBackgroundColour` edit.
- [x] RED: add a store test for applying one colour to all selected frames.
- [x] GREEN: expose `frameStore.setFrameBackgroundColour(colour)` and keep selection unchanged.
- [x] RED: add a test where a selected full-canvas frame participates without visual pixel changes or errors.
- [x] GREEN/refactor: ensure full-canvas content bounds are handled as an empty padding area.
- [x] Run focused unit tests for import, editing/store, and any affected renderer helpers.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 3: Inspector UI via TDD

**WHAT:** Add the colour picker to `Inspector.svelte`, including mixed-selection display and helper text.
**WHY:** Users need discoverable single and bulk colour editing in the existing frame inspector.

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Re-read the plan and verify `questions.md` has no unresolved blocker for the UX copy.
- [x] RED: add Inspector component tests for colour control visibility when a frame is selected and absence when no frame is selected.
- [x] GREEN: render the colour control in the inspector near duration.
- [x] RED: add tests for same-colour, mixed-colour, and full-canvas helper text states.
- [x] GREEN: derive colour value/placeholder/helper state from selected frames and wire change events to the store.
- [x] Add package styles/imports only as needed; keep inspector layout accessible and keyboard-friendly.
- [x] Run focused component/unit tests and `pnpm check` to catch Svelte/TypeScript warnings.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 4: Canvas redraw and E2E coverage via TDD

**WHAT:** Ensure the selected canvas redraws after background changes, then add an E2E test covering import, multi-select, colour apply, and full-canvas selection participation.
**WHY:** Store changes are not enough if the canvas does not repaint; the user explicitly requested E2E coverage.

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Re-read the plan before changing Canvas redraw dependencies.
- [x] RED: add or adjust a focused test proving a selected frame rerenders when its `imageData` changes without changing selection.
- [x] GREEN: update Canvas redraw tracking with minimal load-stream regression risk.
- [x] RED: add E2E test: load `test.gif`, import `landscape.gif`, select imported padded frame plus at least one full-canvas frame, set one background colour in inspector, assert padded frame canvas corner pixel changes and full-canvas frame selection does not break.
- [x] GREEN: add missing test helpers/selectors needed for stable colour-picker interaction and canvas pixel sampling.
- [x] If an existing test needs modification/removal, stop and update `questions.md` for explicit confirmation before proceeding.
- [x] Build before E2E as required.
- [x] Run focused E2E spec.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 5: Full verification, warnings, and polish

**WHAT:** Run all required verification, fix warnings, and finalise documentation of results.
**WHY:** The user explicitly requires no regressions across E2E, unit, and Rust tests, plus warning checks.

- [x] Read the relevant skills for this phase before editing any file: `tdd`
- [x] Re-read the plan before deciding whether any remaining warnings are acceptable.
- [x] Run `pnpm check`; fix warnings in the best-practice way or document why not.
- [x] Run all unit tests: `pnpm test:unit`.
- [x] Run Rust tests: `cd src-tauri && cargo test`.
- [x] Build before E2E: use the project build command required by the E2E harness (`pnpm tauri build` per README, or `pnpm build` plus required Tauri binary if the harness has changed).
- [x] Run all E2E tests: `pnpm test:e2e`.
- [x] If any command fails, follow the 3-strike protocol and log each error in `plan.md`.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 6: Selection-change mutation bug via TDD

**WHAT:** Stop selection changes from committing colour changes unless the user edits the background control.
**WHY:** Selection expansion currently changes frame colours without explicit user action, which is data corruption.

- [x] Read the relevant skills for this phase before editing any file: `tdd`.
- [x] Re-read this plan and `findings.md`, especially the suspected `pickerHex`/`bind:hex`/`onInput` feedback-loop root cause.
- [x] RED: add an E2E regression test that creates frames with different background colours, expands selection, and asserts no selected frame colour/padding pixels change merely from selection.
- [x] RED: add the smallest unit/source-level test feasible to ensure Inspector selection-derived colour updates do not call `frameStore.setFrameBackgroundColour` unless a colour input/picker event is user-originated.
- [x] GREEN: separate display/synchronisation state from commit state; do not call `setFrameBackgroundColour` from reactive/effect-driven picker updates.
- [x] GREEN: keep mixed selection display as `Mixed`; only apply one colour to all selected frames after a user edits the hex input or picker.
- [x] Run focused Inspector/unit tests and the new focused E2E regression.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 7: Picker placement/styling decision spike

**WHAT:** Decide whether to embed the picker inside the Inspector or keep popup behaviour with an overlay/portal-style solution.
**WHY:** The current white popup and clipped/scrolling layout are poor UX; the chosen fix should be deliberate before changing UI code.

- [x] Read the relevant skills for this phase before editing any file: `tdd`.
- [x] Re-read this plan and `findings.md` before deciding the exact UI approach.
- [x] Validate the three options below against the installed package API and current Inspector layout:
  - Option A: theme the existing package popup in place.
  - Option B: embedded compact picker toggled below the background colour field (`isDialog={false}`), sized to Inspector width.
  - Option C: app-owned overlay/portal that opens over the canvas to the left of the Inspector.
- [x] Prefer Option B unless research during this phase finds a blocker; it is simpler than overlay/portal positioning and fixes the white-background issue and Inspector clipping together.
- [x] Process Q3 confirmation: user chose Option B.
- [x] If Option C becomes necessary, design explicit outside-click, focus, z-index, and leftward positioning rules before implementation.
- [x] Add/update `questions.md` only if the recommended option changes or needs user confirmation.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 8: Picker UX implementation via TDD

**WHAT:** Implement the chosen picker UX so it matches the app theme and is fully visible without hidden Inspector scrolling or horizontal clipping.
**WHY:** Users should see and use the colour picker without white surfaces, clipped controls, or surprise scroll behaviour.

- [x] Read the relevant skills for this phase before editing any file: `tdd`.
- [x] Re-read this plan and confirm Phase 7 selected approach before editing `Inspector.svelte`; selected approach is Option B, embedded compact picker.
- [x] RED: add Inspector SSR/source tests for dark/app-themed picker variables/classes and the Option B open/closed markup.
- [x] RED: add E2E coverage that opens the picker and asserts it is visually within the intended bounds: no horizontal overflow, no clipped content, no new horizontal/side scrolling, and themed surface/border values match the Inspector.
- [x] GREEN: for recommended Option B, render a compact embedded picker only after the background field is clicked/focused or a toggle is activated; use `isDialog={false}`, `isTextInput={false}`, `isAlpha={false}`, app CSS variables, and constrained `--picker-width`/`--picker-height`.
- [x] GREEN: if Option C is selected instead, move/position picker DOM so it overlays above the Inspector and opens left into canvas space, without being clipped by `.inspector-body`. Not applicable; Option B was selected.
- [x] Preserve keyboard accessibility: focusable trigger/control, Escape or outside-click close if applicable, no trap that blocks existing Inspector shortcuts.
- [x] Run focused Inspector/unit tests and focused E2E picker UX tests.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

### Phase 9: Final follow-up verification

**WHAT:** Re-run warning, unit, Rust, build, and E2E verification after the follow-up fixes.
**WHY:** The fixes touch UI state, picker package integration, and E2E behaviour; full regression coverage is required.

- [x] Read the relevant skills for this phase before editing any file: `tdd`.
- [x] Run `pnpm check`; fix warnings properly or document why not.
- [x] Run all unit tests: `pnpm test:unit`.
- [x] Run Rust tests: `cd src-tauri && cargo test`.
- [x] Build before E2E: `pnpm tauri build`.
- [x] Run all E2E tests: `pnpm test:e2e`.
- [x] If any command fails, follow the 3-strike protocol and log each error in `plan.md`.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill.
- **Status:** Complete

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Multi-phase plan | Likely touches more than 5 files, needs more than 5 tool uses, and likely exceeds 150 changed lines. |
| Prefer `svelte-awesome-color-picker` | Complete Svelte 5 picker, TypeScript support, accessibility/keyboard support, fallback native input, smaller package metadata, faster integration than Huey primitives. |
| Preserve black default padding | Maintains current behaviour and avoids modifying/removing the existing black-padding test. |
| Store content bounds metadata | Allows recolouring only padding pixels without corrupting naturally black pixels inside the imported image. |
| Show picker for full-canvas frames | Consistent inspector and reliable bulk-edit UX; helper text explains no visible effect. |
| Use baked RGBA image updates | Fits existing renderer/export path and avoids Rust export changes. |
| User approved implementation defaults | Q1 response confirmed the proposed library, metadata, full-canvas UX, and mixed-selection behaviour. |
| Follow-up recommendation: embedded compact picker | Easiest robust fix for white popup and clipping because package supports `isDialog={false}` and CSS sizing/theme variables; avoids app-owned portal/overlay complexity. |
| User confirmed Option B | Q3 response selected embedded compact picker, so Phase 8 should implement Option B rather than an overlay/portal. |
| Selection changes must never commit colours | Colour application must be user-originated only; reactive state synchronisation must not call frame mutation methods. |

## Errors Encountered

| Timestamp | Error | Attempt | Resolution |
| --------- | ----- | ------- | ---------- |
| 2026-07-12 | Usage-specific fetch for `svelte-awesome-color-picker` docs returned “No relevant content found.” | 1 | Used README, search snippets, and npm metadata; plan includes verifying package API during Phase 1. |
| 2026-07-12 | Fetching `https://github.com/hueycolor/huey/tree/main/packages/svelte` blocked by URL approval rules. | 1 | Used root repository README/file tree and npm metadata; plan includes Huey only as fallback. |
| 2026-07-12 | `npm view` emitted npm update notice `New minor version of npm available! 11.9.0 -> 11.18.0`. | 1 | Informational only; no action needed for this feature plan. |
| 2026-07-12 | `pnpm add svelte-awesome-color-picker` emitted pnpm update notice and deprecated transitive subdependency warning (`glob@10.5.0`, `glob@8.1.0`, `inflight@1.0.6`, `whatwg-encoding@3.1.1`). | 1 | Informational package-manager/transitive warnings only; `pnpm check`, unit, Rust, build, and E2E passed with 0 Svelte warnings. |

## Notes

- Existing tests planned for modification/removal: none.
- New tests planned: import normalisation, frame editing/store, Inspector component, Canvas redraw if needed, E2E colour apply, selection-change no-mutation regression, picker visibility/styling E2E.
- Update `## Status` and phase status as work progresses.
- Re-read this plan before major decisions.
- Log all errors here and do not repeat failed actions unchanged.
