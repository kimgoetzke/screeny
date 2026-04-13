<script lang="ts">
  import { frameStore } from "$lib/stores/frames.svelte";

  let dragFromIndex: number | null = $state(null);
  let dragOverIndex: number | null = $state(null);

  function handleDragStart(index: number, event: DragEvent) {
    dragFromIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    dragOverIndex = index;
  }

  function handleDrop(index: number, event: DragEvent) {
    event.preventDefault();
    if (dragFromIndex !== null && dragFromIndex !== index) {
      frameStore.reorderFrames(dragFromIndex, index);
    }
    dragFromIndex = null;
    dragOverIndex = null;
  }

  function handleDragEnd() {
    dragFromIndex = null;
    dragOverIndex = null;
  }
</script>

<div class="timeline" data-testid="timeline">
  {#if frameStore.hasFrames}
    <div class="frames-strip" data-testid="frames-strip">
      {#each frameStore.frames as frame, index (frame.id)}
        <div
          class="frame-thumb"
          class:selected={frame.id === frameStore.selectedFrameId}
          class:drag-over={dragOverIndex === index && dragFromIndex !== index}
          draggable="true"
          role="button"
          tabindex="0"
          data-testid="frame-thumb-{index}"
          data-frame-id={frame.id}
          ondragstart={(e) => handleDragStart(index, e)}
          ondragover={(e) => handleDragOver(index, e)}
          ondrop={(e) => handleDrop(index, e)}
          ondragend={handleDragEnd}
          onclick={() => frameStore.selectFrame(frame.id)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") frameStore.selectFrame(frame.id);
            if (e.key === "Delete") frameStore.deleteFrame(frame.id);
          }}
        >
          <img src={frame.imageData} alt="Frame {index + 1}" draggable="false" />
          <div class="frame-info">
            <span class="frame-number">{index + 1}</span>
            <span class="frame-duration" data-testid="frame-duration-{index}"
              >{frame.duration}ms</span
            >
          </div>
          <button
            class="delete-btn"
            data-testid="frame-delete-{index}"
            onclick={(e) => {
              e.stopPropagation();
              frameStore.deleteFrame(frame.id);
            }}
            title="Delete frame"
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty" data-testid="timeline-empty">No frames loaded</div>
  {/if}
</div>

<style>
  .timeline {
    flex-shrink: 0;
    height: 140px;
    background: #1a1a1a;
    border-top: 1px solid #333;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .frames-strip {
    display: flex;
    gap: 4px;
    padding: 8px;
    height: 100%;
    align-items: center;
  }

  .frame-thumb {
    position: relative;
    flex-shrink: 0;
    height: 100px;
    border: 2px solid #444;
    border-radius: 4px;
    cursor: grab;
    overflow: hidden;
    transition: border-color 0.15s;
  }

  .frame-thumb:active {
    cursor: grabbing;
  }

  .frame-thumb.selected {
    border-color: #5b9bd5;
  }

  .frame-thumb.drag-over {
    border-color: #7bc87b;
    border-style: dashed;
  }

  .frame-thumb img {
    height: 100%;
    width: auto;
    display: block;
    image-rendering: pixelated;
  }

  .frame-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 2px 4px;
    background: rgba(0, 0, 0, 0.7);
    font-size: 10px;
    color: #ccc;
  }

  .delete-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(200, 50, 50, 0.8);
    color: white;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .frame-thumb:hover .delete-btn {
    opacity: 1;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-size: 13px;
  }
</style>
