# Plan: Deepen Project Lifecycle

<!--
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Populate this file last during planning. Update after each phase completes.
-->

## Goal

Deepen Screeny’s **Project Lifecycle** module so one rune-backed seam owns **Open**, **Cancel**, **Close**, and **Export** orchestration, explicit **Project State**, derived lifecycle view data, and lifecycle dialog state, while **Canvas** fitting and drag-drop error presentation remain outside that seam.

## User Prompt

The user asked for a persisted implementation plan using the `planning` skill for the chosen deepening candidate from the `improve-codebase` review: the **Project Lifecycle** module. The plan must preserve enough detail that a fresh-session implementing agent can pick up the work without losing architectural context.

Assumptions carried into the plan:
- The refactor is frontend/TypeScript/Svelte-only unless implementation uncovers a compelling reason to change Rust adapters. Current evidence does not require Rust changes.
- `frameStore` remains available to `Canvas`, `Timeline`, and `Inspector` during this refactor; only lifecycle callers should stop depending on it directly.
- Existing user-visible behavior should be preserved unless explicitly changed by the agreed design decisions.
- The implementing agent should follow TDD and grow the new seam through behavior-level tests rather than bulk rewrites.

## Status

Complete

## Work

### Phase 1: Establish the deepened Project Lifecycle seam behind tests

<!--
  WHAT: Introduce the new lifecycle interface and implementation while preserving current behavior.
  WHY: This creates the new seam before UI ownership moves, reducing risk.
  WHEN: Start implementation here.
-->

- [x] Read the relevant skills for this phase before editing any file: `improve-codebase`, `tdd`
- [x] Re-read `context.md`, `findings.md`, and `design.md` before major edits so the **Project State** model and agreed seam stay in attention.
- [x] Add or rewrite lifecycle-facing tests in `src/lib/projectLifecycle.test.ts` to describe the new public behavior one slice at a time (explicit `projectState`, `toolbarFeedback`, `closeRequested`, `openFromPath`, `requestClose`, `confirmClose`, `dismissClose`, `cancel`, `export`).
- [x] Introduce `src/lib/projectLifecycle.svelte.ts` as the new deepened **Module** and implement the minimum behavior needed to satisfy each test slice.
- [x] Fold the orchestration from `src/lib/projectOpen.ts` into the lifecycle implementation as coverage grows, while preserving current silent cancellation/superseded-**Open** semantics.
- [x] Keep `onFirstFrame` as a configured callback on lifecycle creation, not part of lifecycle-owned **Canvas** logic.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase.
- **Status:** Complete

### Phase 2: Move lifecycle adapters and dialog ownership to +page.svelte, then thin Toolbar

<!--
  WHAT: Re-home adapter assembly and dialog rendering so callers only consume the lifecycle seam.
  WHY: This is where the depth pays off for UI callers.
-->

- [x] Read the relevant skills for this phase before editing any file: `improve-codebase`, `tdd`
- [x] Re-read `plan.md`, `findings.md`, and `design.md` before major decisions.
- [x] Move dialog adapter ownership (file picker, save-path input, close confirmation) from `src/lib/components/Toolbar.svelte` to `src/routes/+page.svelte`.
- [x] Create the lifecycle instance in `src/routes/+page.svelte` with `dialog`, `tauriGifBackend`, `cancelCurrentGifDecode`, and `applyInitialCanvasState` wired as adapters/callbacks.
- [x] Route drag-drop **Open** through `lifecycle.openFromPath(path)` and keep `dropError` presentation local to `+page.svelte`.
- [x] Pass the lifecycle instance into `src/lib/components/Toolbar.svelte` and simplify `Toolbar` so it only renders lifecycle-derived view state and invokes lifecycle commands.
- [x] Preserve current keyboard-binding behavior while moving ownership of close-confirm UI/state to the lifecycle seam.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase.
- **Status:** Complete

### Phase 3: Remove obsolete seams, update tests, and verify the refactor end-to-end

<!--
  WHAT: Clean up transitional code and stabilize the final interface.
  WHY: Ensures the codebase actually benefits from the deeper seam.
-->

- [x] Read the relevant skills for this phase before editing any file: `improve-codebase`, `tdd`
- [x] Re-read `plan.md`, `findings.md`, and `design.md` before cleanup decisions.
- [x] Remove or drastically shrink obsolete orchestration seams (`src/lib/projectLifecycle.ts`, `src/lib/projectOpen.ts`, and any now-redundant helpers in `src/lib/actions.ts`) so there is one clear lifecycle seam.
- [x] Update affected UI tests (`src/lib/components/Toolbar.test.ts`, `src/routes/page.test.ts`, and any other impacted tests) so they verify behavior through the new public interface instead of old ownership assumptions.
- [x] Decide whether `src/lib/projectOpen.test.ts` should be deleted, migrated into lifecycle tests, or retained only for low-level helper behavior that still exists.
- [x] Run verification (`pnpm test:unit` at minimum; run any additional targeted checks needed by the refactor) and confirm the existing Rust test suite remains unaffected unless frontend changes require more.
- [x] Record final files created/modified, unresolved follow-ups, and any errors in the planning docs.
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill before ending the phase.
- **Status:** Complete

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| The lifecycle seam owns **Open / Cancel / Close / Export** | Matches `context.md` and removes split orchestration between `Toolbar`, `+page`, and helper modules. |
| Use explicit **Project State** (`Empty`, `Loading`, `Active`, `Exporting`) | Preserves domain language from `context.md` and gives callers a deeper, more stable interface. |
| Close confirmation is lifecycle state, not a fifth **Project State** | `context.md` defines exactly four states; close confirmation is UI/lifecycle state around transitions, not a domain state itself. |
| Keep **Canvas** fitting outside the lifecycle seam | Prevents the lifecycle module from absorbing unrelated **Canvas** concerns and losing depth. |
| Hide `frameStore` from lifecycle callers only | Improves lifecycle locality without incorrectly merging Frame Editing / Selection into the same seam. |
| Keep current silent cancellation/superseded-open behavior | Preserves current user-visible semantics unless explicitly changed later. |
| Drag-drop error presentation stays local to `+page.svelte` | Keeps the visual error placement local even though the actual **Open** sequence moves behind the lifecycle seam. |
| Implement the new seam as `src/lib/projectLifecycle.svelte.ts` | Rune-backed state matches current codebase patterns and gives callers a compact interface. |
| `+page.svelte` creates the lifecycle instance | Adapter assembly belongs at the parent that now owns dialogs and drag-drop interaction. |
| `openFromPath(path)` returns an outcome | Allows `+page.svelte` to decide whether to show local `dropError` without duplicating the open orchestration. |
| Fold `projectOpen.ts` into lifecycle implementation | Concentrates the most important orchestration logic behind one seam. |
| Expose derived lifecycle view data instead of raw fragments | Increases leverage by letting callers render the lifecycle state directly. |
| Move file picker/save input/close-confirm rendering to `+page.svelte` | Aligns dialog ownership with the parent that assembles the lifecycle adapters. |
| Configure `onFirstFrame` once at lifecycle creation | Both dialog-driven and drag-drop **Open** share the same callback, so one configuration point is simpler and deeper. |

## Errors Encountered

| Timestamp | Error | Attempt | Resolution |
| --------- | ----- | ------- | ---------- |
| 2026-05-03 | `openFromPath()` started resolving `undefined` for cancelled/superseded opens because a `return` inside the `finally` block overrode the intended result path in `src/lib/projectLifecycle.svelte.ts`. | 1 | Removed the `return` from the `finally` block and kept it as conditional cleanup only; the lifecycle tests then passed. |

## Notes

- The implementing agent should treat `findings.md` and `design.md` as required reading before coding.
- If implementation uncovers a load-bearing reason to keep a smaller helper module under the lifecycle seam, record that explicitly in `plan.md` and `findings.md` rather than silently reintroducing a shallow public seam.
- Preserve the agreed invariants from `findings.md` when choosing test cases.
- Update `## Status` and phase status as you progress.
- Re-read this plan before major decisions (attention manipulation).
- Log ALL errors - they help avoid repetition.
