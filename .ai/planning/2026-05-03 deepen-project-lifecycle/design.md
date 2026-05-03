# Target Design: Deepened Project Lifecycle

## Purpose

This document captures the agreed target **Interface**, seam placement, and migration guidance for the **Project Lifecycle** refactor. It is intended as handoff material for a fresh-session implementing agent.

## Agreed Target Interface

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

export function createProjectLifecycle(
  options: ProjectLifecycleOptions,
): ProjectLifecycle;
```

## What Belongs Behind the Seam

The lifecycle **Implementation** should hide:

- dialog sequencing (`DialogProvider` as an **adapter**)
- backend orchestration (`GifBackend` as an **adapter**)
- decode cancellation wiring (`cancelDecode` as an **adapter**)
- `frameStore` lifecycle mutations
- streaming **Open** orchestration currently split across `projectLifecycle.ts` + `projectOpen.ts`
- superseded-**Open** race protection
- explicit **Project State** transitions
- close-confirm bookkeeping
- derived toolbar feedback (`none`, `loading`, `status`)

## What Must Stay Outside the Seam

These concerns were explicitly kept outside the lifecycle seam:

- **Canvas** fit/reset/layout state in `src/routes/+page.svelte`
- local drag-drop error presentation (`dropError` in `+page.svelte`)
- direct `frameStore` usage by non-lifecycle callers such as `Canvas`, `Timeline`, and `Inspector` during this refactor

The lifecycle module may invoke the configured `onFirstFrame` callback, but it must not absorb **Canvas** logic itself.

## Ownership Changes

### Before

- `Toolbar.svelte`
  - owns dialog rendering
  - creates the old lifecycle orchestrator
  - manages local loading/status state
  - owns close-confirm modal state
- `+page.svelte`
  - bypasses lifecycle for drag-drop **Open**
  - owns local `dropError`
  - owns **Canvas** fit/reset behavior
- `projectLifecycle.ts`
  - partial lifecycle orchestration for toolbar only
- `projectOpen.ts`
  - streaming open helper outside the main seam

### After

- `+page.svelte`
  - assembles adapters (`dialog`, `tauriGifBackend`, `cancelCurrentGifDecode`, `applyInitialCanvasState`)
  - creates one lifecycle instance
  - renders lifecycle dialogs (file picker, save input, close confirm)
  - keeps local drag-drop error rendering
  - passes lifecycle instance to `Toolbar`
- `Toolbar.svelte`
  - becomes a thin caller/rendering module for lifecycle state and commands
- `projectLifecycle.svelte.ts`
  - becomes the main lifecycle seam
- `projectOpen.ts`
  - should be folded into the lifecycle implementation or reduced to a clearly private helper if absolutely necessary

## Invariants to Preserve

1. Only one **Open** is current at a time.
2. A superseded **Open** must not mutate the current **Project**.
3. **Cancel** is only meaningful in **Loading**.
4. **Close** request is only meaningful in **Active**.
5. Confirming **Close** always returns the **Project** to **Empty**.
6. **Export** is only meaningful in **Active**.
7. `onFirstFrame` remains caller-supplied behavior triggered from lifecycle milestones.
8. Drag-drop failures remain display-local to `+page.svelte` even though `openFromPath` moves behind the lifecycle seam.

## Suggested File-by-File Migration Notes

### `src/lib/projectLifecycle.svelte.ts` (new)
- Implement the agreed interface.
- Use rune-backed state.
- Internalize orchestration currently split between `projectLifecycle.ts` and `projectOpen.ts`.
- Derive `projectState`, `toolbarFeedback`, and capability booleans from one internal source of truth.

### `src/lib/projectLifecycle.test.ts`
- Promote this to the main test surface.
- Test behavior through the public lifecycle interface only.
- Prefer tracer-bullet TDD slices over bulk rewrites.

### `src/lib/projectOpen.ts`
- Target for removal or absorption.
- If retained temporarily, treat it as private implementation detail, not a public seam.

### `src/lib/actions.ts`
- Re-evaluate after lifecycle extraction.
- Keep only low-level transport helpers/types that still earn their keep.
- Avoid leaving orchestration split between `actions.ts` and `projectLifecycle.svelte.ts`.

### `src/routes/+page.svelte`
- Create the lifecycle instance.
- Move dialog adapter state/rendering here from `Toolbar`.
- Call `lifecycle.openFromPath(path)` from drag-drop handling.
- Keep `dropError` local.
- Keep `applyInitialCanvasState` and other **Canvas** logic local.

### `src/lib/components/Toolbar.svelte`
- Accept the lifecycle instance (or the minimal lifecycle props/commands derived from it).
- Stop owning dialogs and local orchestration state.
- Render controls from `projectState`, `closeRequested`, and `toolbarFeedback`.

## Testing Guidance

Use the `tdd` skill during implementation.

Key behaviors to test through the lifecycle interface:
- initial state is `Empty`
- `open()` and `openFromPath(path)` enter `Loading`, then `Active` on success
- `openFromPath(path)` returns local outcome data for drag-drop callers
- first-frame callback fires at the correct milestone
- cancel during `Loading` prevents late frames from mutating the current **Project**
- superseded opens are ignored
- `requestClose()` toggles `closeRequested` only in `Active`
- `confirmClose()` clears the **Project** and returns to `Empty`
- `dismissClose()` clears the close-request state without closing
- `export()` enters/exits `Exporting` correctly and updates toolbar feedback

## Risks / Watch-outs

- `Toolbar.test.ts` and `page.test.ts` currently assert where logic lives. Those tests will likely fail even if behavior remains correct. Update them to match the new seam rather than preserving old ownership.
- The old `frameStore` loading state may overlap awkwardly with the new explicit lifecycle state. Prefer one clear lifecycle source of truth at the new seam; if transitional duplication is necessary, document it and remove it in Phase 3.
- Keep the drag-drop error split explicit: `openFromPath()` may return `{ error }`, but should not force the toolbar to show the same error unless intentionally designed later.
- Avoid reintroducing a shallow seam by leaving half of **Open** in `projectOpen.ts` and half in `projectLifecycle.svelte.ts` without a clear private/public distinction.
