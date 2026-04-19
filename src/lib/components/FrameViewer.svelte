<script lang="ts">
  import { frameStore } from "$lib/stores/frames.svelte";

  let {
    showEmptyState = true,
    scale = $bindable(1),
    panX = $bindable(0),
    panY = $bindable(0),
  }: {
    showEmptyState?: boolean;
    scale?: number;
    panX?: number;
    panY?: number;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let isPanning = $state(false);
  let lastPointerX = 0;
  let lastPointerY = 0;

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 10;
  const ZOOM_FACTOR = 1.1;

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

  function handleWheel(event: WheelEvent) {
    if (!event.ctrlKey) return;
    event.preventDefault();

    const factor = event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);

    // Cursor-centred zoom: adjust pan so the point under the cursor stays fixed.
    // With transform: scale(s) translate(tx, ty) and transform-origin: center center,
    // the pivot is the viewer centre. mx/my are the cursor offsets from that pivot.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = event.clientX - (rect.left + rect.width / 2);
    const my = event.clientY - (rect.top + rect.height / 2);

    panX = panX + mx * (1 / newScale - 1 / scale);
    panY = panY + my * (1 / newScale - 1 / scale);
    scale = newScale;
  }

  function handlePointerDown(event: PointerEvent) {
    const isRightButton = event.button === 2;
    const isShiftLeft = event.button === 0 && event.shiftKey;
    if (!isRightButton && !isShiftLeft) return;
    event.preventDefault();
    isPanning = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isPanning) return;
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    panX += dx / scale;
    panY += dy / scale;
  }

  function handlePointerUp(_event: PointerEvent) {
    isPanning = false;
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
</script>

<div
  class="viewer"
  class:is-panning={isPanning}
  data-testid="frame-viewer"
  onwheel={handleWheel}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  oncontextmenu={handleContextMenu}
>
  {#if frameStore.hasFrames}
    <canvas
      bind:this={canvas}
      data-testid="frame-canvas"
      style="transform: scale({scale}) translate({panX}px, {panY}px)"
    ></canvas>
  {:else if showEmptyState}
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
    overflow: hidden;
    background: var(--color-bg);
    min-height: 0;
  }

  canvas {
    image-rendering: pixelated;
    transform-origin: center center;
  }

  .viewer.is-panning {
    cursor: grabbing;
  }

  .empty {
    color: var(--color-text-muted);
    font-size: 20px;
    padding: 32px;
    text-align: center;
    line-height: 1.5;
  }
</style>
