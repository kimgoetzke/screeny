<script lang="ts">
  import "$lib/theme.css";
  import { onMount, tick } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import Canvas from "$lib/components/Canvas.svelte";
  import FilePicker from "$lib/components/FilePicker.svelte";
  import NotificationDialog from "$lib/components/NotificationDialog.svelte";
  import { calculateInitialCanvasState, type InitialCanvasState } from "$lib/canvas/canvas-fit";
  import type { DialogProvider } from "$lib/actions";
  import { createProjectLifecycle } from "$lib/project-lifecycle/projectLifecycle.svelte";
  import { cancelCurrentGifDecode, tauriGifBackend } from "$lib/app-shell/tauriGifBackend";
  import { getVisibleCanvasWidth } from "$lib/canvas/inspectorLayout";
  import { isContextualKeyboardBinding } from "$lib/app-shell/keyboardPolicy";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import ZoomIndicator from "$lib/components/ZoomIndicator.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
  import Inspector from "$lib/components/Inspector.svelte";
  import { frameStore } from "$lib/stores/frames.svelte";

  let dragging = $state(false);
  let dropError = $state("");
  let canvasArea: HTMLDivElement | undefined = $state();
  let isE2e = $state(false);

  let showFilePicker = $state(false);
  let filePickerResolve: ((path: string | null) => void) | null = null;

  let showSaveInput = $state(false);
  let savePath = $state("");
  let saveResolve: ((path: string | null) => void) | null = null;

  const EXPANDED_ZOOM_RIGHT_OFFSET = 268;
  const MINIMISED_ZOOM_RIGHT_OFFSET = 60;
  const EXPANDED_DROP_OVERLAY_RIGHT_MARGIN = 265;
  const MINIMISED_DROP_OVERLAY_RIGHT_MARGIN = 55;
  const VIEWER_STATE_EPSILON = 0.0001;
  const DEFAULT_CANVAS_STATE: InitialCanvasState = {
    baseScale: 1,
    panX: 0,
    panY: 0,
  };

  let inspectorMinimised = $state(false);
  let inspectorVisible = $derived(frameStore.hasFrames);
  // ZoomIndicator sits 20px to the left of the inspector panel.
  // Expanded: 240px + 8px gap + 20px = 268px. Minimised: 32px + 8px gap + 20px = 60px.
  let zoomRightOffset = $derived(
    inspectorMinimised ? MINIMISED_ZOOM_RIGHT_OFFSET : EXPANDED_ZOOM_RIGHT_OFFSET,
  );
  // Drop overlay right margin: 10px outer gap + panel width + 10px inner gap (matches CSS margin: 10px).
  let dropOverlayRightMargin = $derived(
    inspectorMinimised ? MINIMISED_DROP_OVERLAY_RIGHT_MARGIN : EXPANDED_DROP_OVERLAY_RIGHT_MARGIN,
  );
  let visibleDropOverlayRightMargin = $derived(inspectorVisible ? dropOverlayRightMargin : 10);

  invoke<boolean>("e2e_check").then((result) => {
    isE2e = result;
  });

  const dialog: DialogProvider = {
    openFile: () =>
      new Promise((resolve) => {
        filePickerResolve = resolve;
        showFilePicker = true;
      }),
    saveFile: async () => {
      if (isE2e) {
        return invoke("e2e_save_path");
      }

      const suggested: string = await invoke("suggest_export_path");
      savePath = suggested;
      showSaveInput = true;
      return new Promise((resolve) => {
        saveResolve = resolve;
      });
    },
  };

  const lifecycle = createProjectLifecycle({
    dialog,
    backend: tauriGifBackend,
    cancelDecode: cancelCurrentGifDecode,
    onFirstFrame: applyInitialCanvasState,
  });

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (!inspectorVisible) return;
    if (isContextualKeyboardBinding(event)) return;
    if (event.ctrlKey && (event.key === "i" || event.key === "I")) {
      event.preventDefault();
      inspectorMinimised = !inspectorMinimised;
    }
    if (
      event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !event.metaKey &&
      (event.key === "r" || event.key === "R")
    ) {
      event.preventDefault();
      void resetCanvasView();
    }
  }

  $effect(() => {
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  });

  let canvasBaseScale = $state(1);
  let canvasScale = $state(1);
  let resetCanvasBaseScale = $state(1);
  let resetCanvasPanX = $state(0);
  let resetCanvasPanY = $state(0);
  let canvasPanX = $state(0);
  let canvasPanY = $state(0);
  let zoomIndicatorScale = $derived((canvasBaseScale * canvasScale) / resetCanvasBaseScale);
  let isCanvasModified = $derived.by(
    () =>
      Math.abs(zoomIndicatorScale - 1) > VIEWER_STATE_EPSILON ||
      Math.abs(canvasPanX - resetCanvasPanX) > VIEWER_STATE_EPSILON ||
      Math.abs(canvasPanY - resetCanvasPanY) > VIEWER_STATE_EPSILON,
  );

  function setResetCanvasState(canvasState: InitialCanvasState) {
    resetCanvasBaseScale = canvasState.baseScale;
    resetCanvasPanX = canvasState.panX;
    resetCanvasPanY = canvasState.panY;
  }

  function setCurrentCanvasState(canvasState: InitialCanvasState) {
    canvasBaseScale = canvasState.baseScale;
    canvasScale = 1;
    canvasPanX = canvasState.panX;
    canvasPanY = canvasState.panY;
  }

  async function resetCanvasView() {
    const canvasState = await getTargetCanvasState();
    setResetCanvasState(canvasState);
    setCurrentCanvasState(canvasState);
  }

  function getVisibleCanvasBounds() {
    if (!canvasArea) return null;

    const canvasRect = canvasArea.getBoundingClientRect();
    const visibleWidth = getVisibleCanvasWidth({
      canvasWidth: canvasRect.width,
      inspectorVisible,
      inspectorMinimised,
    });

    return {
      canvasWidth: canvasRect.width,
      canvasHeight: canvasRect.height,
      visibleCanvasWidth: visibleWidth,
      visibleCanvasHeight: canvasRect.height,
    };
  }

  async function getTargetCanvasState(): Promise<InitialCanvasState> {
    const frame = frameStore.selectedFrame;
    if (!frame) {
      return DEFAULT_CANVAS_STATE;
    }

    await tick();

    const visibleCanvasBounds = getVisibleCanvasBounds();
    if (!visibleCanvasBounds) {
      return DEFAULT_CANVAS_STATE;
    }

    return calculateInitialCanvasState({
      gifWidth: frame.width,
      gifHeight: frame.height,
      canvasWidth: visibleCanvasBounds.canvasWidth,
      canvasHeight: visibleCanvasBounds.canvasHeight,
      visibleCanvasWidth: visibleCanvasBounds.visibleCanvasWidth,
      visibleCanvasHeight: visibleCanvasBounds.visibleCanvasHeight,
    });
  }

  async function syncResetCanvasState() {
    setResetCanvasState(await getTargetCanvasState());
  }

  async function applyInitialCanvasState() {
    const canvasState = await getTargetCanvasState();
    setResetCanvasState(canvasState);
    setCurrentCanvasState(canvasState);
  }

  function handleFilePickerConfirm(path: string) {
    showFilePicker = false;
    filePickerResolve?.(path);
    filePickerResolve = null;
  }

  function handleFilePickerCancel() {
    showFilePicker = false;
    filePickerResolve?.(null);
    filePickerResolve = null;
  }

  function confirmSave() {
    showSaveInput = false;
    saveResolve?.(savePath || null);
    saveResolve = null;
  }

  function cancelSave() {
    showSaveInput = false;
    saveResolve?.(null);
    saveResolve = null;
  }

  $effect(() => {
    inspectorVisible;
    inspectorMinimised;
    void syncResetCanvasState();
  });

  onMount(() => {
    void tick().then(() => {
      invoke("close_splashscreen");
    });

    let unlisten: (() => void) | undefined;

    getCurrentWebviewWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          dragging = true;
        } else if (event.payload.type === "leave") {
          dragging = false;
        } else if (event.payload.type === "drop") {
          dragging = false;
          const paths = event.payload.paths;
          const gifPath = paths.find((p) => p.toLowerCase().endsWith(".gif"));
          if (gifPath) {
            handleDrop(gifPath);
          }
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  });

  async function handleDrop(path: string) {
    dropError = "";
    const result = await lifecycle.openFromPath(path);

    if (result.error) {
      dropError = result.error;
    }
  }
</script>

{#if showFilePicker}
  <FilePicker
    onConfirm={handleFilePickerConfirm}
    onCancel={handleFilePickerCancel}
  />
{/if}

{#if lifecycle.closeRequested}
  <NotificationDialog
    message={"Any unsaved changes will be lost.\nDo you want to continue?"}
    confirmLabel="Continue"
    cancelLabel="Cancel"
    onConfirm={() => lifecycle.confirmClose()}
    onCancel={() => lifecycle.dismissClose()}
  />
{/if}

<div class="app" data-testid="app">
  <Toolbar lifecycle={lifecycle} />

  {#if showSaveInput}
    <div class="toolbar-save-overlay">
      <div class="save-input-row" data-testid="save-input-row">
        <input
          type="text"
          bind:value={savePath}
          placeholder="~/export.gif"
          data-testid="save-path-input"
          onkeydown={(event) => {
            if (event.key === "Enter") confirmSave();
            if (event.key === "Escape") cancelSave();
          }}
        />
        <button onclick={confirmSave} data-testid="btn-save-confirm">Save</button>
        <button onclick={cancelSave} data-testid="btn-save-cancel">Cancel</button>
      </div>
    </div>
  {/if}

  <div class="canvas-area" bind:this={canvasArea}>
    <Canvas
      showEmptyState={!dragging}
      centreOffsetX={resetCanvasPanX}
      baseScale={canvasBaseScale}
      bind:scale={canvasScale}
      bind:panX={canvasPanX}
      bind:panY={canvasPanY}
    />
    {#if inspectorVisible}
      <Inspector bind:minimised={inspectorMinimised} />
    {/if}
    <ZoomIndicator
      scale={zoomIndicatorScale}
      isModified={isCanvasModified}
      onReset={resetCanvasView}
      visible={inspectorVisible}
      rightOffset={zoomRightOffset}
    />
    {#if dragging}
      <div class="drop-overlay" style:margin-right="{visibleDropOverlayRightMargin}px">
        <p>Drop GIF file here</p>
      </div>
    {/if}
    {#if dropError}
      <div class="drop-error">{dropError}</div>
    {/if}
  </div>
  <Timeline />
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(html, body) {
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 16px;
    background: var(--color-bg);
    color: var(--color-text-brightest);
  }

  .app {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .toolbar-save-overlay {
    position: absolute;
    top: 10px;
    right: 144px;
    z-index: 40;
    width: min(520px, calc(100vw - 320px));
  }

  .save-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-elevated);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  }

  .save-input-row input[type="text"] {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 14px;
    min-width: 0;
  }

  .save-input-row input[type="text"]:focus {
    outline: none;
    border-color: var(--color-text-muted);
  }

  .save-input-row button {
    padding: 6px 14px;
    font-size: 14px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    cursor: pointer;
  }

  .save-input-row button:hover {
    background: var(--color-border);
    border-color: var(--color-text-muted);
  }

  .canvas-area {
    position: relative;
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-accent) 15%, transparent);
    border: 3px dashed var(--color-accent);
    border-radius: 8px;
    margin: 10px;
    padding: 8px;
    z-index: 10;
    pointer-events: none;
  }

  .drop-overlay p {
    font-size: 22px;
    color: var(--color-accent);
    font-weight: 600;
  }

  .drop-error {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--color-error) 90%, transparent);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10;
  }
</style>
