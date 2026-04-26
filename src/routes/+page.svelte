<script lang="ts">
  import "$lib/theme.css";
  import { onMount, tick } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { openProjectFromPath } from "$lib/projectOpen";
  import { tauriGifBackend } from "$lib/tauriGifBackend";
  import { calculateInitialViewerState, type InitialViewerState } from "$lib/viewer-fit";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import FrameViewer from "$lib/components/FrameViewer.svelte";
  import ZoomIndicator from "$lib/components/ZoomIndicator.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
  import Inspector from "$lib/components/Inspector.svelte";
  import { frameStore } from "$lib/stores/frames.svelte";

  let dragging = $state(false);
  let dropError = $state("");
  let viewerArea: HTMLDivElement | undefined = $state();

  const EXPANDED_ZOOM_RIGHT_OFFSET = 268;
  const MINIMISED_ZOOM_RIGHT_OFFSET = 60;
  const EXPANDED_DROP_OVERLAY_RIGHT_MARGIN = 265;
  const MINIMISED_DROP_OVERLAY_RIGHT_MARGIN = 55;
  const VIEWER_STATE_EPSILON = 0.0001;
  const DEFAULT_VIEWER_STATE: InitialViewerState = {
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
      void resetView();
    }
  }

  $effect(() => {
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  });

  let viewerBaseScale = $state(1);
  let viewerScale = $state(1);
  let resetViewerBaseScale = $state(1);
  let resetViewerPanX = $state(0);
  let resetViewerPanY = $state(0);
  let viewerPanX = $state(0);
  let viewerPanY = $state(0);
  let zoomIndicatorScale = $derived((viewerBaseScale * viewerScale) / resetViewerBaseScale);
  let isViewerModified = $derived.by(
    () =>
      Math.abs(zoomIndicatorScale - 1) > VIEWER_STATE_EPSILON ||
      Math.abs(viewerPanX - resetViewerPanX) > VIEWER_STATE_EPSILON ||
      Math.abs(viewerPanY - resetViewerPanY) > VIEWER_STATE_EPSILON,
  );

  function setResetViewerState(viewerState: InitialViewerState) {
    resetViewerBaseScale = viewerState.baseScale;
    resetViewerPanX = viewerState.panX;
    resetViewerPanY = viewerState.panY;
  }

  function setCurrentViewerState(viewerState: InitialViewerState) {
    viewerBaseScale = viewerState.baseScale;
    viewerScale = 1;
    viewerPanX = viewerState.panX;
    viewerPanY = viewerState.panY;
  }

  async function resetView() {
    const viewerState = await getTargetViewerState();
    setResetViewerState(viewerState);
    setCurrentViewerState(viewerState);
  }

  function getVisibleViewerBounds() {
    if (!viewerArea) return null;

    const viewerRect = viewerArea.getBoundingClientRect();
    let visibleWidth = viewerRect.width;

    if (inspectorVisible) {
      const inspector = viewerArea.querySelector('[data-testid="inspector"]');
      if (inspector instanceof HTMLElement) {
        const inspectorRect = inspector.getBoundingClientRect();
        visibleWidth = Math.max(inspectorRect.left - viewerRect.left, 1);
      }
    }

    return {
      viewerWidth: viewerRect.width,
      viewerHeight: viewerRect.height,
      visibleWidth,
      visibleHeight: viewerRect.height,
    };
  }

  async function getTargetViewerState(): Promise<InitialViewerState> {
    const frame = frameStore.selectedFrame;
    if (!frame) {
      return DEFAULT_VIEWER_STATE;
    }

    await tick();

    const visibleViewerBounds = getVisibleViewerBounds();
    if (!visibleViewerBounds) {
      return DEFAULT_VIEWER_STATE;
    }

    return calculateInitialViewerState({
      gifWidth: frame.width,
      gifHeight: frame.height,
      viewerWidth: visibleViewerBounds.viewerWidth,
      viewerHeight: visibleViewerBounds.viewerHeight,
      visibleWidth: visibleViewerBounds.visibleWidth,
      visibleHeight: visibleViewerBounds.visibleHeight,
    });
  }

  async function syncResetViewerState() {
    setResetViewerState(await getTargetViewerState());
  }

  async function applyInitialViewerState() {
    const viewerState = await getTargetViewerState();
    setResetViewerState(viewerState);
    setCurrentViewerState(viewerState);
  }

  $effect(() => {
    inspectorVisible;
    inspectorMinimised;
    void syncResetViewerState();
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
      onFirstFrame: applyInitialViewerState,
    });

    if (result.error) {
      dropError = result.error;
    }
  }
</script>

<div class="app" data-testid="app">
  <Toolbar onLoad={applyInitialViewerState} />
  <div class="viewer-area" bind:this={viewerArea}>
    <FrameViewer
      showEmptyState={!dragging}
      centreOffsetX={resetViewerPanX}
      baseScale={viewerBaseScale}
      bind:scale={viewerScale}
      bind:panX={viewerPanX}
      bind:panY={viewerPanY}
    />
    {#if inspectorVisible}
      <Inspector bind:minimised={inspectorMinimised} />
    {/if}
    <ZoomIndicator
      scale={zoomIndicatorScale}
      isModified={isViewerModified}
      onReset={resetView}
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

  .viewer-area {
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
