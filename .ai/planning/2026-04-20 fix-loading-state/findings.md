# Findings & Decisions

## Plan Size

**Multi-phase: No** (single phase, blocked)

## Requirements

- **Bug 1**: Clicking "Open" shows "Loading 0%" in the toolbar immediately, before any file has been selected. Must only appear once a file is confirmed.
- **Bug 2**: Dropping a GIF file shows no "Loading 0%" indicator. Must appear immediately on drop.

---

## Bug 1 — Original root cause

`Toolbar.svelte`'s `handleOpen()` called `loading = true` and `frameStore.startLoading()` **before** `openGifStreaming()` even opened the file dialog. Since `dialog.openFile()` suspends while waiting for user input, the loading state was set instantly on button click.

```typescript
// Original buggy code in Toolbar.svelte
async function handleOpen() {
    loading = true;               // ← fires on button click
    statusMessage = "";
    frameStore.startLoading();    // ← fires on button click
    try {
      const result = await openGifStreaming(...)  // ← file dialog is here
```

## Bug 2 — Original root cause

`+page.svelte`'s `handleDrop()` called `frameStore.startLoading()` synchronously before any async work, so `frameStore.isLoading` became `true`. The toolbar's `{:else if frameStore.isLoading}` condition should have shown the indicator but didn't. Confirmed at runtime in both the built and dev app (Q1 response).

---

## Attempt 1 — `onStart` callback + `flushSync`

### What was done

**`src/lib/actions.ts`**: Added optional `onStart?: () => void` parameter to `openGifStreaming`. Called after `dialog.openFile()` returns a non-null path, before `decodeStreaming`.

**`src/lib/components/Toolbar.svelte`**: Removed upfront `loading = true` / `frameStore.startLoading()` from `handleOpen`. Passed them as the `onStart` callback — so they fire only once a file is confirmed.

**`src/routes/+page.svelte`**: Wrapped `frameStore.startLoading()` in `flushSync` (imported from `'svelte'`) to force a synchronous DOM update before `await invoke(...)` suspends.

### What happened

Unit tests: all passed.

Runtime: **both bugs remained**.

- Bug 1: "Loading 0%" no longer shows *before* file selection (✓) but never shows *after* either (✗). The loading indicator is completely absent.
- Bug 2: unchanged — no indicator on drop.

### Why

`onStart` fires inside a Promise continuation (the `.then()` of `await dialog.openFile()`). Calling `frameStore.startLoading()` (`isLoading = true` in `frames.svelte.ts`) from there did not update `Toolbar.svelte`'s template. Setting local `loading = true` also had no visible effect, suggesting the Promise continuation context is not flushed by Svelte in this environment.

`flushSync` explicitly forces all pending Svelte effects to run synchronously. It did NOT resolve the DnD case in Tauri's WebKitGTK webview. Either `flushSync` does not work in this Tauri/WebKit environment, or the issue is not effect scheduling but rather that the reactive subscription between `frames.svelte.ts` and `Toolbar.svelte` is not being triggered from Tauri's event bridge context at all.

---

## Attempt 2 — `handleFilePickerConfirm` DOM handler + `dropLoading` prop

### What was done

**`src/lib/actions.ts`**: Reverted — `onStart` removed.

**`src/lib/components/Toolbar.svelte`**:
- Moved `loading = true` and `frameStore.startLoading()` into `handleFilePickerConfirm`, which is called from the FilePicker's "Open" button click (`onclick={handleConfirm}` in `FilePicker.svelte`) — a genuine synchronous DOM click event. These run *before* `filePickerResolve?.(path)` resolves the Promise.
- Added `dropLoading = false` prop.
- Changed template condition to `{:else if frameStore.isLoading || dropLoading}`.
- Open button: `disabled={loading || frameStore.isLoading || dropLoading}`.

**`src/routes/+page.svelte`**:
- Removed `flushSync`.
- Added `dropLoading = $state(false)`.
- In `handleDrop`: set `dropLoading = true` before async decode, `dropLoading = false` in `finally`.
- Passed `{dropLoading}` as prop to `<Toolbar>`.

### What happened

Unit tests: all passed (252).

Runtime: **both bugs remained**.

### Why (hypothesis)

**Bug 1**: `handleFilePickerConfirm` IS called from a DOM click event handler (button inside `FilePicker.svelte`). Setting `frameStore.startLoading()` there should work. That it didn't suggests either:
  - The FilePicker button click goes through some Svelte event delegation path that loses the "DOM event" flush context by the time it reaches `handleFilePickerConfirm` as a prop callback, OR
  - `frameStore.isLoading` changing in `frames.svelte.ts` truly does not update `Toolbar.svelte` from ANY callback that isn't directly inside a Svelte component's own synchronous `onclick` handler.

**Bug 2**: `dropLoading = true` is local `$state` in `+page.svelte` — the same component where `dragging = true/false` is set, from the same Tauri event callback. `dragging` DOES update the `+page.svelte` template (drop overlay shows/hides). `dropLoading` is passed as a prop to `Toolbar.svelte`. The prop update apparently does NOT make `Toolbar.svelte` re-render.

This points to the issue being at the **component prop boundary**: when a Tauri event callback fires and sets local state in `+page.svelte`, child components (`Toolbar.svelte`) receiving that state as props do not re-render. But the parent component (`+page.svelte`) itself DOES re-render (hence `dragging` works for the overlay).

---

## Key observable pattern

| State change | Where read | Triggered from | Works? |
| ------------ | ---------- | -------------- | ------ |
| `dragging = true` | `+page.svelte` template | Tauri `onDragDropEvent` callback | ✓ |
| `dropLoading = true` | `Toolbar.svelte` (via prop) | Tauri `onDragDropEvent` callback | ✗ |
| `frameStore.isLoading = true` | `Toolbar.svelte` template | Tauri `onDragDropEvent` callback | ✗ |
| `frameStore.isLoading = true` (original) | `Toolbar.svelte` template | Synchronous DOM button click (handleOpen) | ✓ |

The pattern is: state changes originating in Tauri event callbacks only update the component that *owns* the state. They do not propagate to child components via props or to other components via module-level `$state`.

---

## What to investigate next

1. **Confirm the prop propagation hypothesis**: add a `$effect(() => console.log('dropLoading:', dropLoading))` inside `Toolbar.svelte` and observe at runtime whether the value changes. If the log fires but the DOM doesn't update, it's a Svelte rendering issue. If the log doesn't fire, the prop isn't arriving.

2. **Svelte 5 + WebKitGTK**: check whether this is a known Svelte 5 bug on WebKit. The behaviour is inconsistent with Svelte 5's documented reactivity model. Consider opening a Svelte or Tauri issue with a minimal reproduction.

3. **Alternative architecture**: since only same-component state seems to update from Tauri callbacks, one approach is to move the loading indicator display to `+page.svelte` entirely (as an overlay in the viewer area) rather than in `Toolbar.svelte`. This would make the indicator local to the component whose state reacts to the event.

4. **`tick()` from Svelte**: not yet tried. `await tick()` yields to Svelte's scheduler and might flush updates differently from `flushSync`. Could be tried before the architecture change.

---

## Key files

| File | Role |
| ---- | ---- |
| `src/lib/actions.ts` | `openGifStreaming` — opens file dialog then decodes |
| `src/lib/components/Toolbar.svelte` | Renders loading indicator, Open button, handles file dialog |
| `src/lib/components/FilePicker.svelte` | Custom file picker — `onConfirm` prop called on button click |
| `src/routes/+page.svelte` | Handles drag-and-drop, renders drop overlay |
| `src/lib/stores/frames.svelte.ts` | Module-level `$state` for `isLoading`, `loadingProgress` |
| `src/lib/actions.test.ts` | Unit tests for `openGifStreaming` |
| `src/lib/components/Toolbar.test.ts` | Unit tests for Toolbar rendering |

## Current code state (after Attempt 2)

`src/lib/actions.ts` — original (no `onStart`)

`src/lib/components/Toolbar.svelte`:
- `handleFilePickerConfirm` sets `loading = true` + `frameStore.startLoading()` before resolving the dialog promise
- `dropLoading` prop (default `false`)
- Loading indicator condition: `frameStore.isLoading || dropLoading`
- Open button: `disabled={loading || frameStore.isLoading || dropLoading}`

`src/routes/+page.svelte`:
- `dropLoading = $state(false)`, set in `handleDrop`, cleared in `finally`
- `<Toolbar onLoad={resetView} {dropLoading} />`

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| `onStart` + `flushSync` (Attempt 1) did not fix either bug at runtime | Reverted; identified as cross-component `$state` propagation failure from async/Tauri contexts |
| `dropLoading` prop (Attempt 2) did not fix Bug 2 at runtime | Not resolved; propagation from Tauri event callback to child component via prop appears broken |
| Both approaches pass unit tests but fail at runtime | SSR-based unit tests cannot reproduce Svelte 5 runtime reactivity issues in WebKitGTK |
