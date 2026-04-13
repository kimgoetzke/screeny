<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import FrameViewer from "$lib/components/FrameViewer.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
  import { frameStore } from "$lib/stores/frames.svelte";
  import type { Frame } from "$lib/types";

  let dragging = $state(false);
  let dropError = $state("");

  onMount(() => {
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
    try {
      const frames: Frame[] = await invoke("decode_gif", { path });
      frameStore.setFrames(frames);
    } catch (error) {
      dropError = `Failed to decode GIF: ${error}`;
    }
  }
</script>

<div class="app" data-testid="app">
  <Toolbar />
  <div class="viewer-area">
    <FrameViewer />
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
    font-size: 15px;
    background: #1e1e1e;
    color: #eee;
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
    background: rgba(91, 155, 213, 0.15);
    border: 3px dashed #5b9bd5;
    border-radius: 8px;
    margin: 8px;
    z-index: 10;
    pointer-events: none;
  }

  .drop-overlay p {
    font-size: 22px;
    color: #5b9bd5;
    font-weight: 600;
  }

  .drop-error {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(200, 50, 50, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10;
  }
</style>
