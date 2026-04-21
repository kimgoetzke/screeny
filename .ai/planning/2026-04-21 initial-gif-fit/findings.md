# Findings & Decisions

## Plan Size

**Multi-phase: Yes**

Reasoning: the likely implementation spans route logic, viewer sizing logic, unit tests in at least two files, E2E coverage, and full-project verification. It will easily exceed five tool uses and is likely to touch more than five files once tests and any shared sizing helper are included.

## Requirements

## Captured from user request

- Plan the work only; do not implement in this step.
- Future implementation must use the `tdd` skill.
- On GIF load, the initially displayed image must fit within the visible canvas space and remain centred.
- Initial display must preserve evenly sized gaps on opposite sides.
- Vertically longer GIFs must use exactly 80% of visible canvas height.
- Horizontally longer GIFs must use exactly 80% of visible canvas width.
- The displayed GIF must never exceed visible canvas space in either direction.
- Visible canvas space depends on window size and inspector state.
- The minimised inspector area counts as visible space; the expanded inspector area does not.
- This work only covers the initial load/first frame display, not resize or re-zoom on later window changes.
- Borders and other existing behaviour must remain unchanged.
- The initial displayed state is considered 100% zoom.
- Future implementation must check warnings, address them where appropriate, then run build plus all unit, E2E, and Rust tests.

## Research Findings

## Key discoveries during exploration

- Planning templates require persistent files in `.ai/planning/2026-04-21 initial-gif-fit/`.
- The plan must explicitly say when to update planning files and must reference the `tdd` skill for implementation.
- The main viewer wiring lives in `src/routes/+page.svelte`; it owns `inspectorMinimised`, `inspectorVisible`, and passes `scale` into `FrameViewer`.
- `FrameViewer.svelte` owns the canvas element, applies `transform: scale(...) translate(...)`, and currently defaults to `scale = 1`.
- Existing SSR unit tests already cover inspector-aware centring in `src/routes/page.test.ts` and `src/lib/components/FrameViewer.test.ts`, so initial-fit planning should extend those areas first.
- The questions template is straightforward; no open requirement ambiguity is obvious yet, so `questions.md` can be created with no active questions unless research uncovers one.
- GIF load currently ends in `handleDrop()` calling `resetView()`, which hard-resets scale to `1` and pan to the inspector-aware centre offset after decode completes.
- `FrameViewer` does not currently measure available viewport space; its canvas renders at natural pixel size and only changes size through the shared `scale` transform.
- Centring today is achieved by a 1px stage positioned at the viewer centre plus optional horizontal pan. This means initial fit can likely be implemented by computing an initial `scale` at load time without changing the centring model.
- Expanded inspector handling is currently approximated through `resetViewerPanX = -(dropOverlayRightMargin / 2)`, which centres content in the visible area left of the inspector rather than beneath it.
- Inspector geometry is explicit in CSS: expanded width `240px`, minimised width `32px`, `right: 15px`, `top: 20px`, `bottom: 20px`. That confirms the visible area calculation must exclude the expanded panel footprint but may include the minimised gutter.
- The progress template is required for multi-phase plans and expects per-phase actions, touched files, test logs, and error logs; if this task is classified multi-phase, the plan must include explicit planning-file update steps each phase.
- `page.test.ts` currently hard-codes the reset model around `viewerScale = 1`, `viewerPanX = resetViewerPanX`, and `handleDrop()` calling `resetView()`. Initial-fit work will need to update these expectations because “100%” becomes the computed initial-fit scale, not always literal `1`.
- `FrameViewer.test.ts` already asserts the stage transform string, guide-line placement, and inspector-aware fade centring. That makes it a good place to add tests for any new initial-fit props or derived transform inputs without needing DOM mounting.
- Frontend validation commands are in `package.json`: `pnpm check`, `pnpm build`, `pnpm test:unit`, and `pnpm test:e2e`. Rust verification should run with `cargo test` from `src-tauri/`.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Use `initial-gif-fit` as the task name | Short, specific, and suitable for the planning folder and conversation rename hint |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| None yet | N/A |

## Resources

## URLs, file paths, API references

- `.ai/planning/2026-04-21 initial-gif-fit/`
- `/home/kgoe/.copilot/skills/planning/templates/findings.md`
- `/home/kgoe/.copilot/skills/planning/templates/plan.md`
- `/home/kgoe/.copilot/skills/planning/templates/questions.md`
- `src/routes/+page.svelte`
- `src/lib/components/FrameViewer.svelte`
- `src/routes/page.test.ts`
- `src/lib/components/FrameViewer.test.ts`
- `handleDrop()` in `src/routes/+page.svelte`
- `src/lib/components/Inspector.svelte`
- `/home/kgoe/.copilot/skills/planning/templates/progress.md`

## Visual/Browser Findings

## Multimodal content must be captured as text immediately

- Template review confirms findings must be updated after every 2 view/browser/search operations.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
