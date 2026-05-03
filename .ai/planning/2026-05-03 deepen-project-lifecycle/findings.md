# Findings

<!--
  WHAT: Your knowledge base for the task. Stores everything you discover and decide.
  WHY: Context windows are limited. This file is your "external memory" - persistent and unlimited.
  WHEN: After every 2 view/browser/search operations, IMMEDIATELY save key findings here (2-Action Rule).
-->

## Plan Size

**Multi-phase: Yes**
Reasoning: The refactor is expected to touch more than 5 files (`src/routes/+page.svelte`, `src/lib/components/Toolbar.svelte`, `src/lib/projectLifecycle.ts`, `src/lib/projectOpen.ts`, `src/lib/actions.ts`, tests, and likely a new `src/lib/projectLifecycle.svelte.ts`). It will also require well over 5 tool uses and likely exceed 150 lines of change because lifecycle orchestration, dialog ownership, and tests all need to move.

## Requirements

- Create a plan for deepening the **Project Lifecycle** module rather than implementing immediately.
- Preserve enough detail that a fresh-session implementing agent can execute the refactor without losing context.
- The refactor target is the Screeny **Project Lifecycle** domain concept from `context.md`.
- The deepened **Project Lifecycle** module must own all **Project State** transitions for **Open**, **Cancel**, **Close**, and **Export**.
- The **Interface** should expose explicit **Project State** values exactly matching `context.md`: `Empty`, `Loading`, `Active`, `Exporting`.
- **Close** confirmation should be part of the lifecycle **Interface**, but not a fifth **Project State**.
- Lifecycle-facing UI state (loading/exporting/progress/status) should live behind the **Project Lifecycle** module.
- **Canvas** fitting should remain outside the seam as a callback, not become part of lifecycle implementation.
- `frameStore` should be hidden behind the lifecycle **Implementation** for lifecycle callers; the whole UI does not need to stop using it in this refactor.
- Cancellation/superseded-**Open** behaviour should keep current silent semantics.
- Drag-drop error presentation should remain local to `src/routes/+page.svelte`.
- The deepened module should expose **derived lifecycle view data** rather than raw status/progress fragments.
- `+page.svelte` should create the lifecycle module instance and assemble its adapters.
- Dialog rendering/ownership for file picker, save input, and close confirmation should move to `+page.svelte`.
- The **Canvas** first-frame callback should be configured once when creating the lifecycle module, not passed on every open command.

## Research Findings

- Domain language from `context.md`:
  - **Project Lifecycle** is the orchestration layer wiring together `DialogProvider`, `GifBackend`, `frameStore`, and rendering synchronisation for **Open**, **Close**, **Cancel**, and **Export**.
  - **Project State** is defined as exactly four states: **Empty**, **Loading**, **Active**, **Exporting**.
  - **Close** applies in **Active**; **Cancel** applies in **Loading**.
- Current lifecycle ownership is split across multiple files:
  - `src/lib/projectLifecycle.ts` handles toolbar-driven **Open**, **Cancel**, and **Export** orchestration, but not drag-drop **Open** or **Close** confirmation.
  - `src/lib/projectOpen.ts` owns streaming decode + `frameStore` loading session coordination.
  - `src/lib/actions.ts` owns low-level decode/export helpers and `ActionResult`.
  - `src/routes/+page.svelte` handles drag-drop **Open**, local `dropError`, canvas-fit state, and app-level keybindings.
  - `src/lib/components/Toolbar.svelte` owns dialog rendering, local `loading` and `statusMessage`, close-confirm UI, and wires `createProjectLifecycle(...)`.
- Current cancellation/race handling is spread across three mechanisms:
  - `openCallId` in `src/lib/projectLifecycle.ts`
  - `loadSessionId` in `src/lib/stores/frames.svelte.ts`
  - `currentDecodeId` in `src/lib/tauriGifBackend.ts`
  This is a sign the current seam is shallow; callers still need to understand too much of the implementation.
- `src/lib/stores/frames.svelte.ts` currently mixes several responsibilities:
  - ordered **Frame** storage
  - **Selection** state
  - playback timers
  - loading session bookkeeping
  - lifecycle-ish transitions like `startLoading`, `finishLoading`, `cancelLoad`, `clear`
  The planned refactor should hide only the lifecycle-facing parts from lifecycle callers, not absorb all Frame Editing / Selection concerns into one seam.
- `src/lib/components/Toolbar.svelte` currently contains several responsibilities that should move up or inward:
  - file picker modal and save-path input (dialog adapter)
  - close confirmation modal
  - local toolbar `loading` and `statusMessage`
  - direct wiring of `createProjectLifecycle(...)`
  - direct knowledge of `cancelCurrentGifDecode()` and `frameStore.clear()` via the lifecycle flow
- `src/routes/+page.svelte` currently bypasses the lifecycle seam for drag-drop by calling `openProjectFromPath(path, tauriGifBackend, { onFirstFrame: applyInitialCanvasState })` directly.
- `src/routes/+page.svelte` also owns the **Canvas** fit/reset state. This should remain outside the lifecycle seam. The lifecycle module may call a supplied `onFirstFrame` callback, but must not become responsible for **Canvas** layout.
- Existing tests establish current behaviour and should guide the refactor:
  - `src/lib/projectLifecycle.test.ts` already tests toolbar-driven orchestration.
  - `src/lib/projectOpen.test.ts` tests streaming decode/session handling and may shrink or disappear after refactor.
  - `src/lib/components/Toolbar.test.ts` and `src/routes/page.test.ts` contain several assertions about where logic currently lives; these will need updating because ownership will shift.
- Current unit and Rust tests both pass before refactor:
  - `pnpm test:unit` → 28 files, 358 tests passed.
  - `cargo test --manifest-path src-tauri/Cargo.toml` → 38 Rust tests passed.
- Phase 1 implementation now exists in `src/lib/projectLifecycle.svelte.ts`:
  - it exposes the agreed explicit `ProjectState` / `ToolbarFeedback` surface
  - it keeps drag-drop-oriented `openFromPath(path)` result reporting separate from toolbar status feedback
  - `open()` records completion/error feedback for toolbar callers, while `openFromPath(path)` leaves post-load toolbar feedback clear for `+page.svelte`
  - it internalises the streaming-open orchestration that had previously lived mostly in `projectOpen.ts`, while still reusing low-level decode/export helpers from `actions.ts`
  - it keeps `onFirstFrame` as lifecycle configuration and manages close-confirm state behind the seam
- A bug surfaced during TDD: a `return` inside the `finally` block of the new lifecycle open flow caused cancelled/superseded opens to resolve `undefined` instead of `{}`; removing that `return` restored the intended silent-cancellation semantics.
- Phase 2 moved adapter ownership and lifecycle callers into the intended places:
  - `src/routes/+page.svelte` now owns the file picker, save-path input, close-confirm rendering, and lifecycle creation.
  - `src/lib/components/Toolbar.svelte` now consumes a `ProjectLifecycle` instance instead of assembling adapters or owning dialog state.
  - drag-drop now calls `lifecycle.openFromPath(path)` and keeps `dropError` local to the page.
- Phase 3 cleanup decisions:
  - `src/lib/projectLifecycle.ts` was reduced to a compatibility shim that re-exports the new seam from `src/lib/projectLifecycle.svelte.ts`.
  - `src/lib/projectOpen.ts` was retained temporarily as a deprecated compatibility helper; `src/lib/projectOpen.test.ts` remains only for that helper's lower-level streaming/load behavior while the file still exists.
  - `src/lib/actions.ts` still earns its keep as the low-level decode/export helper module; no further shrink was required in this refactor.
  - `context.md` was updated so the documented Project Lifecycle seam points at `src/lib/projectLifecycle.svelte.ts`.
- Final verification after completing the refactor:
  - `pnpm vitest run src/lib/projectLifecycle.test.ts` → 1 file / 7 tests passed.
  - `pnpm vitest run src/lib/components/Toolbar.test.ts src/routes/page.test.ts` → 2 files / 37 tests passed.
  - `pnpm test:unit` → 28 files / 353 tests passed.
  - `cargo test --manifest-path src-tauri/Cargo.toml` → 38 tests passed.
- Proposed target seam from the design discussion:
  - add `src/lib/projectLifecycle.svelte.ts`
  - expose one lifecycle instance from `createProjectLifecycle(options)`
  - likely fold most/all of current `projectOpen.ts` into the lifecycle implementation
  - keep `actions.ts` only for low-level transport types/helpers if still useful
- Recommended target interface from the design discussion:

  ```ts
  export type ProjectState = "Empty" | "Loading" | "Active" | "Exporting";

  export type ToolbarFeedback =
    | { kind: "none" }
    | { kind: "loading"; label: string; percent: number }
    | { kind: "status"; message: string };

  export interface ProjectLifecycleOptions {
    dialog: DialogProvider;
    backend: GifBackend;
    cancelDecode: () => Promise<void> | void;
    onFirstFrame?: () => Promise<void> | void;
  }

  export interface ProjectLifecycleOpenResult {
    message?: string;
    error?: string;
  }

  export interface ProjectLifecycle {
    readonly projectState: ProjectState;
    readonly hasProject: boolean;
    readonly closeRequested: boolean;
    readonly toolbarFeedback: ToolbarFeedback;

    readonly canOpen: boolean;
    readonly canCancel: boolean;
    readonly canClose: boolean;
    readonly canExport: boolean;

    open(): Promise<void>;
    openFromPath(path: string): Promise<ProjectLifecycleOpenResult>;
    cancel(): Promise<void>;
    requestClose(): void;
    confirmClose(): void;
    dismissClose(): void;
    export(): Promise<void>;
  }
  ```
- Agreed design decisions from the conversation:
  - Scope: **Project Lifecycle** owns **Open / Cancel / Close / Export**.
  - State ownership: lifecycle-facing state belongs behind the lifecycle seam.
  - **Canvas** fit callback stays outside the seam.
  - `frameStore` should be hidden from lifecycle callers, but not necessarily from the entire UI in this refactor.
  - Keep current silent semantics for user-cancelled/superseded **Open**.
  - **Close** confirmation belongs inside lifecycle state, but not as a fifth **Project State**.
  - Use explicit **Project State** model (not booleans-only state).
  - Drag-drop error channel stays local in `+page.svelte`.
  - Keep `requestClose` meaningful only in **Active**; **Cancel** remains the **Loading** action.
  - Use a rune-backed module (`projectLifecycle.svelte.ts`) rather than plain TS stores.
  - `+page.svelte` should create one lifecycle instance and pass it to `Toolbar`.
  - `openFromPath` should return an outcome so `+page.svelte` can decide whether to show local `dropError`.
  - Fold `projectOpen.ts` into lifecycle implementation rather than keep a prominent separate seam.
  - Use derived lifecycle view data at the seam instead of raw fragments.
  - Move dialog adapter ownership and modal rendering to `+page.svelte`.
  - Configure the first-frame **Canvas** callback once when creating the lifecycle module.
- Because the plan is multi-phase, the planning folder must include `plan.md`, `questions.md`, `findings.md`, and `progress.md`.
- Core invariants that the new seam must protect:
  1. Only one **Open** is current at a time.
  2. A superseded **Open** must not mutate the current **Project**.
  3. **Cancel** is only meaningful in **Loading**.
  4. **Close** request is only meaningful in **Active**.
  5. Confirming **Close** always returns the **Project** to **Empty**.
  6. **Export** is only meaningful in **Active**.
  7. `onFirstFrame` remains caller-supplied behaviour triggered at the right lifecycle milestone.

## Resources

- Domain model: `context.md`
- Existing lifecycle seam: `src/lib/projectLifecycle.ts`
- Current streaming open implementation: `src/lib/projectOpen.ts`
- Low-level action helpers: `src/lib/actions.ts`
- Current toolbar orchestration and dialogs: `src/lib/components/Toolbar.svelte`
- Drag-drop and canvas-fit owner: `src/routes/+page.svelte`
- State adapter currently used by lifecycle: `src/lib/stores/frames.svelte.ts`
- Backend adapter: `src/lib/tauriGifBackend.ts`
- Existing tests:
  - `src/lib/projectLifecycle.test.ts`
  - `src/lib/projectOpen.test.ts`
  - `src/lib/components/Toolbar.test.ts`
  - `src/routes/page.test.ts`
- Architectural vocabulary: `/home/kgoe/.pi/agent/skills/improve-codebase/language.md`
- Planning outputs:
  - `.ai/planning/2026-05-03 deepen-project-lifecycle/plan.md`
  - `.ai/planning/2026-05-03 deepen-project-lifecycle/questions.md`
  - `.ai/planning/2026-05-03 deepen-project-lifecycle/progress.md`
  - `.ai/planning/2026-05-03 deepen-project-lifecycle/design.md`
- Planning skill templates:
  - `/home/kgoe/.pi/agent/skills/planning/templates/findings.md`
  - `/home/kgoe/.pi/agent/skills/planning/templates/plan.md`
  - `/home/kgoe/.pi/agent/skills/planning/templates/questions.md`
  - `/home/kgoe/.pi/agent/skills/planning/templates/progress.md`

## Visual/Browser Findings

- No browser or image-specific findings were needed for this plan.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
