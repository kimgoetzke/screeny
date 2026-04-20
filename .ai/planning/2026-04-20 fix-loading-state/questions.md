# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Drag-and-drop loading indicator — reactivity or visibility issue?

The current `handleDrop` in `+page.svelte` already calls `frameStore.startLoading()` synchronously before the `await invoke(...)` call. `frameStore.isLoading` should therefore be `true` and the toolbar should show "Loading 0%". Two possible explanations for the user-reported missing indicator:

1. **Reactivity issue**: Svelte 5 `$state` mutations inside a Tauri native drag-drop event callback (`getCurrentWebviewWindow().onDragDropEvent(...)`) do not trigger reactive updates to components in the same tick as expected, causing the toolbar to miss the state change.
2. **Visibility issue**: The toolbar loading indicator does appear, but is not prominent enough — the user may have expected an overlay in the viewer area (where the "Drop GIF file here" overlay was) rather than just the toolbar.

Is there a specific scenario or test setup that shows the "Loading 0%" is absent, or is this observed at runtime in the built/dev app?

### Response

The issue is observed at run-time in the built + dev app.
<!-- Processed -->
