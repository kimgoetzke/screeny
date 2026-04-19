<script lang="ts">
  import { frameStore } from "$lib/stores/frames.svelte";

  let { minimised = $bindable(false) }: { minimised?: boolean } = $props();

  let frames = $derived(frameStore.frames);
  let selectedFrameId = $derived(frameStore.selectedFrameId);
  let selectedFrameIds = $derived(frameStore.selectedFrameIds);
  let selectedFrame = $derived(frameStore.selectedFrame);
  let isMultiSelect = $derived(selectedFrameIds.size > 1);

  let frameIndicator = $derived.by(() => {
    if (!selectedFrameId || frames.length === 0) return "No frame selected";
    if (!isMultiSelect) {
      const index = frames.findIndex((f) => f.id === selectedFrameId) + 1;
      return `Frame ${index} / ${frames.length}`;
    }
    const selectedIndices = frames
      .map((f, i) => (selectedFrameIds.has(f.id) ? i + 1 : null))
      .filter((i): i is number => i !== null);
    const first = Math.min(...selectedIndices);
    const last = Math.max(...selectedIndices);
    return `Frames ${first}-${last} / ${frames.length}`;
  });

  let durationValue = $derived.by(() => {
    if (selectedFrameIds.size === 0) return "";
    if (!isMultiSelect) return String(selectedFrame?.duration ?? "");
    const selected = frames.filter((f) => selectedFrameIds.has(f.id));
    const durations = new Set(selected.map((f) => f.duration));
    return durations.size === 1 ? String(selected[0].duration) : "";
  });

  let durationPlaceholder = $derived.by(() => {
    if (!isMultiSelect) return "";
    const selected = frames.filter((f) => selectedFrameIds.has(f.id));
    const durations = new Set(selected.map((f) => f.duration));
    return durations.size === 1 ? "" : "Mixed";
  });

  function handleDurationInput(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value)) {
      frameStore.setFrameDuration(value);
    }
  }

  function handleDurationWheel(event: WheelEvent) {
    event.preventDefault();
    // WebKit converts Shift+vertical-scroll to horizontal scroll (deltaY=0, deltaX≠0).
    // Fall back to deltaX so Shift+scroll still adjusts by ±100.
    const scroll = event.deltaY !== 0 ? event.deltaY : event.deltaX;
    if (scroll === 0) return;
    const delta = event.shiftKey ? (scroll < 0 ? 100 : -100) : scroll < 0 ? 1 : -1;
    const current = selectedFrame?.duration ?? parseInt(durationValue, 10);
    if (current !== undefined && !isNaN(current)) {
      frameStore.setFrameDuration(current + delta);
    }
  }
</script>

<aside class="inspector" class:minimised data-testid="inspector">
  {#if !minimised}
    <div class="inspector-header">
      <span class="inspector-title">Inspector</span>
    </div>

    <div class="inspector-body">
      <p class="frame-indicator" data-testid="inspector-frame-indicator">{frameIndicator}</p>

      {#if isMultiSelect}
        <span class="bulk-edit-tag" data-testid="inspector-bulk-edit">Bulk edit</span>
      {/if}

      {#if selectedFrameId}
        <div class="duration-row" data-testid="inspector-duration">
          <label class="duration-label" for="inspector-duration-input">Duration:</label>
          <input
            id="inspector-duration-input"
            type="number"
            min="1"
            max="9999"
            value={durationValue}
            placeholder={durationPlaceholder}
            data-testid="inspector-duration-input"
            oninput={handleDurationInput}
            onwheel={handleDurationWheel}
          />
          <span class="duration-unit">ms</span>
        </div>

        {#if isMultiSelect}
          <div class="dedup-section" data-testid="inspector-dedup">
            <button
              onclick={() => frameStore.deduplicateAdjacentMerge()}
              data-testid="inspector-dedup-merge"
              title="Remove adjacent duplicate frames (merge duration of duplicates)"
              >Dedup (merge duration)</button
            >
            <button
              onclick={() => frameStore.deduplicateAdjacentDrop()}
              data-testid="inspector-dedup-drop"
              title="Remove adjacent duplicate frames (drop duration of duplicates)"
              >Dedup (drop duration)</button
            >
          </div>
        {/if}

        <div class="action-buttons" data-testid="inspector-actions">
          <button
            onclick={() => frameStore.duplicateSelectedFrames()}
            data-testid="inspector-btn-duplicate"
            title="Duplicate selected frame(s)"
          >
            <!-- Duplicate icon: two overlapping squares -->
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect
                x="4"
                y="4"
                width="8"
                height="8"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                rx="1"
              />
              <rect
                x="2"
                y="2"
                width="8"
                height="8"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                rx="1"
              />
            </svg>
          </button>
          <button
            onclick={() => frameStore.deleteSelectedFrames()}
            data-testid="inspector-btn-delete"
            title="Delete selected frame(s)"
          >
            <!-- Bin icon -->
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
              />
              <path
                fill-rule="evenodd"
                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3a.5.5 0 0 0 0 1H6v-.5a.5.5 0 0 0-.5-.5H2.5z"
              />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="inspector-footer" data-testid="inspector-footer">
    <button
      class="toggle-btn"
      data-testid={minimised ? "inspector-restore" : "inspector-minimise"}
      onclick={() => (minimised = !minimised)}
      title={minimised ? "Restore inspector" : "Minimise inspector"}
    >
      {#if minimised}
        <!-- Restore: vertical bar on right, arrow pointing left -->
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="13" y1="2" x2="13" y2="14" />
          <line x1="10" y1="8" x2="2" y2="8" />
          <polyline points="5,5 2,8 5,11" />
        </svg>
      {:else}
        <!-- Minimise: vertical bar on right, arrow pointing right -->
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="13" y1="2" x2="13" y2="14" />
          <line x1="2" y1="8" x2="10" y2="8" />
          <polyline points="7,5 10,8 7,11" />
        </svg>
      {/if}
    </button>
  </div>
</aside>

<style>
  .inspector {
    position: absolute;
    right: 15px;
    top: 20px;
    bottom: 20px;
    width: 240px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 5;
  }

  .inspector.minimised {
    width: 32px;
  }

  .inspector-header {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .inspector-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-brightest);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .inspector-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .inspector-footer {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    padding: 4px;
    margin-top: auto;
    border-top: 1px solid var(--color-border);
  }

  .inspector.minimised .inspector-footer {
    border-top: none;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 3px;
  }

  .toggle-btn:hover {
    color: var(--color-text-brightest);
    background: var(--color-border);
  }

  .frame-indicator {
    color: var(--color-text-muted);
    font-size: 15px;
    padding: 10px 0px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .bulk-edit-tag {
    align-self: flex-start;
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 8px;
    border-radius: 3px;
    background: var(--color-accent);
    color: var(--color-text-brightest);
  }

  .duration-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .duration-label {
    font-size: 12px;
    color: var(--color-text-muted);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .duration-row input[type="number"] {
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 13px;
  }

  .duration-row input[type="number"]:focus {
    outline: none;
    border-color: var(--color-text-muted);
  }

  /* Remove browser-native spin buttons — mouse wheel handles increment/decrement */
  .duration-row input[type="number"] {
    appearance: textfield;
  }

  .duration-row input[type="number"]::-webkit-inner-spin-button,
  .duration-row input[type="number"]::-webkit-outer-spin-button {
    display: none;
  }

  .duration-unit {
    font-size: 12px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .dedup-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dedup-section button {
    padding: 6px 10px;
    font-size: 12px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    cursor: pointer;
    text-align: left;
  }

  .dedup-section button:hover {
    background: var(--color-border);
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .action-buttons button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    cursor: pointer;
  }

  .action-buttons button:hover {
    background: var(--color-border);
  }
</style>
