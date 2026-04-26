<script lang="ts">
  import "$lib/theme.css";
  import { onMount, tick } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import Canvas from "$lib/components/Canvas.svelte";
  import { calculateInitialCanvasState, type InitialCanvasState } from "$lib/canvas-fit";
  import { openProjectFromPath } from "$lib/projectOpen";
  import { tauriGifBackend } from "$lib/tauriGifBackend";
  import { getVisibleCanvasWidth } from "$lib/inspectorLayout";
  import { isContextualKeyboardBinding } from "$lib/keyboardPolicy";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import ZoomIndicator from "$lib/components/ZoomIndicator.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
  import Inspector from "$lib/components/Inspector.svelte";
  import { frameStore } from "$lib/stores/frames.svelte";

  let dragging = $state(false);
  let dropError = $state("");
  let canvasArea: HTMLDivElement | undefined = $state();

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
    const result = await openProjectFromPath(path, tauriGifBackend, {
      onFirstFrame: applyInitialCanvasState,
    });

    if (result.error) {
      dropError = result.error;
    }
  }
</script>

<div class="app" data-testid="app">
  <Toolbar onLoad={applyInitialCanvasState} />
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
    display: flex;
    flex-direction: column;
    height: 100vh;
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
