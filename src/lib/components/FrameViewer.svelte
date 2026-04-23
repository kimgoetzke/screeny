<script lang="ts">
  import { frameStore } from "$lib/stores/frames.svelte";

  let {
    showEmptyState = true,
    centreOffsetX = 0,
    baseScale = 1,
    scale = $bindable(1),
    panX = $bindable(0),
    panY = $bindable(0),
  }: {
    showEmptyState?: boolean;
    centreOffsetX?: number;
    baseScale?: number;
    scale?: number;
    panX?: number;
    panY?: number;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let isPanning = $state(false);
  let lastPointerX = 0;
  let lastPointerY = 0;
  let displayPanX = $derived(frameStore.hasFrames ? panX : 0);
  let displayCentreOffsetX = $derived(frameStore.hasFrames ? centreOffsetX : 0);
  let gifWidth = $derived(frameStore.selectedFrame?.width ?? 0);
  let gifHeight = $derived(frameStore.selectedFrame?.height ?? 0);
  let actualScale = $derived(baseScale * scale);
  let stageTransform = $derived(
    `transform: scale(${actualScale}) translate(${displayPanX}px, ${panY}px)`,
  );

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
    event.preventDefault();

    const factor = event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const newZoom = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);
    const newScale = baseScale * newZoom;

    // Cursor-centred zoom: adjust pan so the point under the cursor stays fixed.
    // With transform: scale(s) translate(tx, ty) and transform-origin: center center,
    // the pivot is the viewer centre. mx/my are the cursor offsets from that pivot.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = event.clientX - (rect.left + rect.width / 2);
    const my = event.clientY - (rect.top + rect.height / 2);

    panX = panX + mx * (1 / newScale - 1 / actualScale);
    panY = panY + my * (1 / newScale - 1 / actualScale);
    scale = newZoom;
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
    panX += dx / actualScale;
    panY += dy / actualScale;
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
  role="application"
  aria-label="Frame viewer"
  data-testid="frame-viewer"
  onwheel={handleWheel}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  oncontextmenu={handleContextMenu}
>
  <div
    class="viewer-grid-fade"
    data-testid="viewer-grid-fade"
    aria-hidden="true"
    style="--fade-center-x: calc(50% + {displayPanX}px); --fade-center-y: calc(50% + {panY}px)"
  >
    <div class="viewer-grid-stage" data-testid="viewer-grid-stage" style={stageTransform}>
      <div class="viewer-grid" data-testid="viewer-grid"></div>
    </div>
  </div>
  <div
    class="viewer-guide-fade"
    data-testid="viewer-guide-fade"
    aria-hidden="true"
    style="--fade-center-x: calc(50% + {displayPanX}px); --fade-center-y: calc(50% + {panY}px)"
  >
    <div class="viewer-guide-stage" data-testid="viewer-guide-stage" style={stageTransform}>
      {#if frameStore.hasFrames}
        <div
          class="guide-line guide-line-h"
          data-testid="guide-line-top"
          style="top: calc(50% - {gifHeight / 2 + 1}px)"
        ></div>
        <div
          class="guide-line guide-line-h"
          data-testid="guide-line-bottom"
          style="top: calc(50% + {gifHeight / 2}px)"
        ></div>
        <div
          class="guide-line guide-line-v"
          data-testid="guide-line-left"
          style="left: calc(50% - {gifWidth / 2 + 1}px)"
        ></div>
        <div
          class="guide-line guide-line-v"
          data-testid="guide-line-right"
          style="left: calc(50% + {gifWidth / 2}px)"
        ></div>
      {/if}
    </div>
  </div>
  <div class="viewer-stage" data-testid="viewer-stage" style={stageTransform}>
    {#if frameStore.hasFrames}
      <canvas bind:this={canvas} data-testid="frame-canvas"></canvas>
    {/if}
  </div>
  {#if !frameStore.hasFrames && showEmptyState}
    <div
      class="empty"
      data-testid="viewer-empty"
      style:transform="translateX({displayCentreOffsetX}px)"
    >
      <p>Open or drop a GIF to get started</p>
    </div>
  {/if}
</div>

<style>
  .viewer {
    flex: 1;
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--color-bg);
    min-height: 0;
  }

  .viewer-grid-fade,
  .viewer-guide-fade,
  .viewer-grid-stage,
  .viewer-guide-stage,
  .viewer-stage {
    grid-area: 1 / 1;
  }

  .viewer-grid-fade,
  .viewer-guide-fade {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    pointer-events: none;
    mask-image: radial-gradient(
      circle at var(--fade-center-x, 50%) var(--fade-center-y, 50%),
      black 0%,
      black 18%,
      transparent 65%,
      transparent 100%
    );
  }

  .viewer-grid-stage,
  .viewer-guide-stage,
  .viewer-stage {
    position: relative;
    width: 1px;
    height: 1px;
    transform-origin: center center;
    pointer-events: none;
  }

  .viewer-grid {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 9600px;
    height: 9600px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    pointer-events: none;
    background-image:
      linear-gradient(
        color-mix(in srgb, var(--color-text-muted) 12%, transparent) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-text-muted) 12%, transparent) 1px,
        transparent 1px
      );
    background-size: 32px 32px;
    background-position: center center;
  }

  canvas {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    image-rendering: pixelated;
    transform: translate(-50%, -50%);
  }

  .guide-line {
    position: absolute;
    pointer-events: none;
    background: color-mix(in srgb, var(--color-text-bright) 45%, transparent);
  }

  .guide-line-h {
    width: 9600px;
    height: 1px;
    left: 50%;
    transform: translateX(-50%);
  }

  .guide-line-v {
    width: 1px;
    height: 9600px;
    top: 50%;
    transform: translateY(-50%);
  }

  .viewer.is-panning {
    cursor: grabbing;
  }

  .empty {
    grid-area: 1 / 1;
    position: relative;
    z-index: 1;
    color: var(--color-text-muted);
    font-size: 20px;
    padding: 32px;
    text-align: center;
    line-height: 1.5;
  }
</style>
