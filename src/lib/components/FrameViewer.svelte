<script lang="ts">
  import { frameStore } from "$lib/stores/frames.svelte";

  let canvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const frame = frameStore.selectedFrame;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas!.width = img.naturalWidth;
      canvas!.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = frame.imageData;
  });
</script>

<div class="viewer" data-testid="frame-viewer">
  {#if frameStore.hasFrames}
    <canvas bind:this={canvas} data-testid="frame-canvas"></canvas>
  {:else}
    <div class="empty" data-testid="viewer-empty">
      <p>Open or drop a GIF to get started</p>
    </div>
  {/if}
</div>

<style>
  .viewer {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    background: #1e1e1e;
    min-height: 0;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .empty {
    color: #666;
    font-size: 20px;
    padding: 32px;
    text-align: center;
    line-height: 1.5;
  }
</style>
