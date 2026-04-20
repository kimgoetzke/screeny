# Task Plan: Fix loading indicator timing for Open button and drag-and-drop

## Goal

The toolbar "Loading 0%" indicator must only appear after a file has been confirmed: deferred to post-selection for the Open button, and shown immediately (not suppressed) for drag-and-drop.

## Status: BLOCKED — two approaches attempted, neither resolved the runtime bugs

Both bugs remain unfixed at runtime. All attempts pass unit tests but fail in the Tauri dev/built app. See `findings.md` for full detail.

## Current Phase

Blocked — paused for future continuation

## Phases

### Phase 1: Requirements & Discovery

- **Status:** complete

### Phase 2: Implementation attempts

#### Attempt 1 — `onStart` callback + `flushSync`

- Added optional `onStart?: () => void` to `openGifStreaming` in `actions.ts`, called after `dialog.openFile()` returns a path and before `decodeStreaming`
- In `Toolbar.svelte`'s `handleOpen`, passed `loading = true; frameStore.startLoading()` as the `onStart` callback
- In `+page.svelte`'s `handleDrop`, wrapped `frameStore.startLoading()` in `flushSync` from `'svelte'`
- Added `disabled={loading || frameStore.isLoading}` on the Open button

**Result**: Both bugs remained. Bug 1 ("Loading 0%" before file selected) was gone, but "Loading 0%" never appeared at all. Bug 2 (DnD) unchanged.

**Why it failed**: `onStart` is called inside a Promise continuation (after `await dialog.openFile()` resolves). `flushSync` should force a synchronous DOM update but does NOT work in Tauri's WebKitGTK webview for cross-component module-level `$state`. Both `onStart`'s `frameStore.startLoading()` and `flushSync`'s forced flush failed to make `Toolbar.svelte` re-render.

#### Attempt 2 — `handleFilePickerConfirm` + `dropLoading` prop

- Moved `loading = true` and `frameStore.startLoading()` to `handleFilePickerConfirm` in `Toolbar.svelte` (a synchronous DOM click handler, called before `filePickerResolve?.(path)`)
- Reverted `actions.ts` `onStart` change
- Added `dropLoading = $state(false)` in `+page.svelte`; set `true` before async decode, `false` in `finally`
- Passed `dropLoading` as a prop to `Toolbar.svelte`
- Template condition changed to `{:else if frameStore.isLoading || dropLoading}`
- Open button: `disabled={loading || frameStore.isLoading || dropLoading}`

**Result**: Both bugs remained.

**Why it likely failed**: `handleFilePickerConfirm` IS a DOM click handler, so `frameStore.startLoading()` setting `isLoading = true` should have worked — but it didn't. For Bug 2: `dropLoading = true` is local state in `+page.svelte` (same component as the Tauri event callback), analogous to `dragging` which DOES work. Yet the `dropLoading` prop update did not appear to make `Toolbar.svelte` re-render either.

**Unresolved mystery**: `dragging = true/false` (local `$state` in `+page.svelte`, read in `+page.svelte`) reacts correctly from the Tauri event callback. `dropLoading = true` (also local `$state` in `+page.svelte`, passed as prop to `Toolbar.svelte`) does NOT appear to work. This suggests the issue may be at the prop boundary between components when triggered from a Tauri event callback, not just at cross-module `$state` reads.

### Phase 3: Tests

- Tests were updated for each attempt and pass (252 tests). Tests use SSR rendering and cannot reproduce the runtime reactivity failure.
- **Status:** complete (but tests do not cover the runtime behaviour)

### Phase 4: Documentation

- **Status:** complete

## Decisions Made

| Decision                                             | Rationale                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `onStart` callback on `openGifStreaming` (Attempt 1) | Tried to defer loading state to post-file-selection — failed at runtime          |
| `flushSync` in `handleDrop` (Attempt 1)              | Tried to force Svelte effect flush — failed in WebKitGTK Tauri                   |
| `handleFilePickerConfirm` DOM handler (Attempt 2)    | Tried to call `startLoading` from a guaranteed DOM event — still failed          |
| `dropLoading` prop (Attempt 2)                       | Tried to bypass cross-module `$state` by using local state + prop — still failed |

## Errors Encountered

| Error                                             | Attempt | Resolution                                                                                          |
| ------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| "Loading 0%" disappeared entirely for Open button | 1       | Identified cause: `onStart` fires in Promise continuation, cross-module `$state` not reactive there |
| "Loading 0%" still absent for DnD                 | 1       | `flushSync` does not force cross-component DOM update in WebKitGTK                                  |
| Both bugs unchanged                               | 2       | Unknown — `dropLoading` prop from same-component local state not propagating to Toolbar             |

## What to investigate next

- Why `dropLoading` prop passing from `+page.svelte` to `Toolbar.svelte` doesn't trigger a re-render when set from a Tauri event callback. If `dragging` (same component, same callback) works, the issue may be Svelte 5 prop reactivity at the component boundary.
- Whether the issue is specific to `onDragDropEvent` vs. standard `addEventListener` events.
- Whether adding `data-testid` observability to the runtime (e.g. console logging inside `$effect(() => { console.log(dropLoading) })` in `Toolbar.svelte`) can confirm whether the prop value is arriving.
- Consider filing a Svelte 5 / Tauri WebKitGTK issue if the prop reactivity problem can be isolated.

## Notes

- `pnpm test:unit` — all 252 tests pass
- The current code on disk reflects **Attempt 2** (not the original)
