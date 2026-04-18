<script lang="ts">
  import { frameStore } from "$lib/stores/frames.svelte";

  // Drag state — pointer-event based to avoid HTML5 DnD unreliability in WebKitGTK/Wayland
  let dragFrameIndex = $state<number | null>(null);
  let dragActive = $state(false);
  let isDraggingSelection = $state(false);
  let insertionIndex = $state<number | null>(null);
  let insertionX = $state<number | null>(null);
  let framesStripEl = $state<HTMLElement | null>(null);

  // Pointer position at drag start — used to suppress sub-threshold micro-moves
  let pointerStartX = 0;
  let pointerStartY = 0;
  // Set briefly after a drag completes so the subsequent click event is swallowed
  let wasJustDragging = false;

  const DRAG_THRESHOLD = 5; // pixels

  function handleFramePointerDown(index: number, event: PointerEvent) {
    if (event.button !== 0) return; // left button only
    event.preventDefault(); // prevent text selection while dragging
    dragFrameIndex = index;
    dragActive = false;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    const frame = frameStore.frames[index];
    // Multi-drag: only when the grabbed frame is part of an active multi-selection
    isDraggingSelection = frame
      ? frameStore.selectedFrameIds.has(frame.id) && frameStore.selectedFrameIds.size > 1
      : false;
  }

  function handleWindowPointerMove(event: PointerEvent) {
    if (dragFrameIndex === null || !framesStripEl) return;

    // Commit to a drag once movement exceeds the threshold
    if (!dragActive) {
      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      dragActive = true;
    }

    // Determine which insertion slot the cursor is nearest to.
    // Slot 0 = before frame 0, slot n = after frame n-1.
    // The midpoint of each frame thumbnail is the boundary between adjacent slots.
    const thumbs = Array.from(
      framesStripEl.querySelectorAll<HTMLElement>('[data-testid^="frame-thumb-"]'),
    );
    const stripRect = framesStripEl.getBoundingClientRect();

    let newInsertionIndex = thumbs.length;
    // rect.left - stripRect.left gives the content-relative X position regardless of scroll,
    // because both values shift equally when the parent timeline scrolls.
    let newInsertionX =
      thumbs.length > 0
        ? thumbs[thumbs.length - 1].getBoundingClientRect().right - stripRect.left
        : 8;

    for (let i = 0; i < thumbs.length; i++) {
      const rect = thumbs[i].getBoundingClientRect();
      if (event.clientX < rect.left + rect.width / 2) {
        newInsertionIndex = i;
        newInsertionX = rect.left - stripRect.left;
        break;
      }
    }

    insertionIndex = newInsertionIndex;
    insertionX = newInsertionX;
  }

  function handleWindowPointerUp(_event: PointerEvent) {
    if (dragFrameIndex === null) return;

    if (dragActive && insertionIndex !== null) {
      wasJustDragging = true;
      if (isDraggingSelection) {
        frameStore.moveFramesToInsertionPoint(insertionIndex);
      } else {
        // Convert insertion slot → reorderFrames parameters.
        // Slot s maps to post-removal index: s-1 if s > from (dragging forward), else s.
        const from = dragFrameIndex;
        const to = insertionIndex > from ? insertionIndex - 1 : insertionIndex;
        if (to !== from) {
          frameStore.reorderFrames(from, to);
        }
      }
    }

    dragFrameIndex = null;
    dragActive = false;
    isDraggingSelection = false;
    insertionIndex = null;
    insertionX = null;
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (!event.ctrlKey || event.key !== "a") return;
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    event.preventDefault();
    frameStore.selectAllFrames();
  }

  // Window-level listeners handle move and release even when the pointer leaves the strip
  $effect(() => {
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  });

  function handleFrameClick(frameId: string, event: MouseEvent) {
    // Swallow the click that fires immediately after a drag completes
    if (wasJustDragging) {
      wasJustDragging = false;
      return;
    }
    if (event.shiftKey) {
      frameStore.shiftSelectFrames(frameId);
    } else {
      frameStore.selectFrame(frameId);
    }
  }
</script>

<div class="timeline" class:is-dragging={dragActive} data-testid="timeline">
  {#if frameStore.hasFrames}
    <div class="frames-strip" data-testid="frames-strip" bind:this={framesStripEl}>
      {#if dragActive && insertionX !== null}
        <div class="insertion-bar" style="left: {insertionX}px;" data-testid="insertion-bar"></div>
      {/if}
      {#each frameStore.frames as frame, index (frame.id)}
        {@const isSelected = frameStore.selectedFrameIds.has(frame.id)}
        {@const selectionCount = frameStore.selectedFrameIds.size}
        {@const isBeingDragged =
          dragActive && (isDraggingSelection ? isSelected : index === dragFrameIndex)}
        <div
          class="frame-thumb"
          class:selected={isSelected}
          class:being-dragged={isBeingDragged}
          role="button"
          tabindex="0"
          data-testid="frame-thumb-{index}"
          data-frame-id={frame.id}
          onpointerdown={(e) => handleFramePointerDown(index, e)}
          onclick={(e) => handleFrameClick(frame.id, e)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") frameStore.selectFrame(frame.id);
            if (e.key === "Delete") frameStore.deleteSelectedFrames();
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
              if (isSelected) {
                frameStore.deleteSelectedFrames();
              } else {
                frameStore.deleteFrame(frame.id);
              }
            }}
            title="Delete frame(s)"
          >
            ×{#if isSelected && selectionCount > 1}<span
                class="delete-count"
                data-testid="delete-count-{index}">{selectionCount}</span
              >{/if}
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
    background: var(--color-bg-elevated);
    border-top: 1px solid var(--color-border);
    overflow-x: auto;
    overflow-y: hidden;
  }

  /* Prevent text selection and show grabbing cursor during an active drag */
  .timeline.is-dragging {
    user-select: none;
  }

  .timeline.is-dragging,
  .timeline.is-dragging * {
    cursor: grabbing !important;
  }

  .frames-strip {
    position: relative;
    display: flex;
    gap: 4px;
    padding: 8px;
    height: 100%;
    align-items: center;
  }

  /* Vertical insertion indicator shown while dragging */
  .insertion-bar {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: var(--color-accent);
    border-radius: 2px;
    pointer-events: none;
    z-index: 10;
    transform: translateX(-50%);
  }

  .frame-thumb {
    position: relative;
    flex-shrink: 0;
    height: 100px;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    cursor: grab;
    overflow: hidden;
    transition: border-color 0.15s;
  }

  .frame-thumb.selected {
    border-color: var(--color-accent);
  }

  /* Selected frames being moved together are dimmed to reinforce they are "in flight" */
  .frame-thumb.being-dragged {
    opacity: 0.4;
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
    background: color-mix(in srgb, var(--color-bg) 70%, transparent);
    font-size: 10px;
    color: var(--color-text);
  }

  .delete-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    min-width: 18px;
    height: 18px;
    padding: 0 3px;
    border: 2px solid transparent;
    border-radius: 3px;
    background: color-mix(in srgb, var(--color-error) 80%, transparent);
    color: var(--color-text-brightest);
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.15s,
      background-color 0.15s,
      border-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .delete-count {
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
  }

  .frame-thumb:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover,
  .delete-btn:focus-visible {
    opacity: 1;
    background: var(--color-error);
    border-color: color-mix(in srgb, var(--color-error) 25%, var(--color-text-brightest));
  }

  /* Red tint on all selected frames when any selected frame's delete button is hovered */
  .frames-strip:has(.frame-thumb.selected .delete-btn:hover) .frame-thumb.selected::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(220, 38, 38, 0.25);
    pointer-events: none;
  }

  /* Red tint on any frame when its own delete button is hovered */
  .frame-thumb:has(.delete-btn:hover)::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(220, 38, 38, 0.25);
    pointer-events: none;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted);
    font-size: 15px;
    padding: 16px;
  }
</style>
