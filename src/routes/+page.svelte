<script lang="ts">
  import "$lib/theme.css";
  import { onMount } from "svelte";
  import { Channel, invoke } from "@tauri-apps/api/core";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import type { DecodeEvent } from "$lib/types";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import FrameViewer from "$lib/components/FrameViewer.svelte";
  import ZoomIndicator from "$lib/components/ZoomIndicator.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
  import Inspector from "$lib/components/Inspector.svelte";
  import { frameStore } from "$lib/stores/frames.svelte";

  let dragging = $state(false);
  let dropError = $state("");

  let inspectorMinimised = $state(false);
  // ZoomIndicator sits 20px to the left of the inspector panel.
  // Expanded: 240px + 8px gap + 20px = 268px. Minimised: 32px + 8px gap + 20px = 60px.
  let zoomRightOffset = $derived(inspectorMinimised ? 60 : 268);

  let viewerScale = $state(1);
  let viewerPanX = $state(0);
  let viewerPanY = $state(0);

  function resetView() {
    viewerScale = 1;
    viewerPanX = 0;
    viewerPanY = 0;
  }

  onMount(() => {
    invoke("close_splashscreen");

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
    frameStore.startLoading();
    try {
      const channel = new Channel<DecodeEvent>();
      channel.onmessage = (event) => {
        if (event.type === "frame") {
          frameStore.addFrame(event.data);
        } else if (event.type === "progress") {
          const percentage = Math.round(
            (event.data.bytesRead / event.data.totalBytes) * 100,
          );
          frameStore.setLoadingProgress(percentage);
        }
      };
      await invoke("decode_gif_stream", { path, onEvent: channel });
    } catch (error) {
      dropError = `Failed to decode GIF: ${error}`;
    } finally {
      frameStore.finishLoading();
    }
  }
</script>

<div class="app" data-testid="app">
  <Toolbar />
  <div class="viewer-area">
    <FrameViewer showEmptyState={!dragging} bind:scale={viewerScale} bind:panX={viewerPanX} bind:panY={viewerPanY} />
    <Inspector bind:minimised={inspectorMinimised} />
    <ZoomIndicator
      scale={viewerScale}
      isModified={viewerScale !== 1 || viewerPanX !== 0 || viewerPanY !== 0}
      onReset={resetView}
      visible={frameStore.hasFrames}
      rightOffset={zoomRightOffset}
    />
    {#if dragging}
      <div class="drop-overlay">
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
    margin: 8px;
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
