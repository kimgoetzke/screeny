<script lang="ts">
  import ColorPicker from "svelte-awesome-color-picker";
  import { INSPECTOR_LAYOUT } from "$lib/canvas/inspectorLayout";
  import { frameStore } from "$lib/stores/frames.svelte";
  import type { Frame } from "$lib/types";

  let { minimised = $bindable(false) }: { minimised?: boolean } = $props();

  let frames = $derived(frameStore.frames);
  let selectedFrameId = $derived(frameStore.selectedFrameId);
  let selectedFrameIds = $derived(frameStore.selectedFrameIds);
  let selectedFrame = $derived(frameStore.selectedFrame);
  let isMultiSelect = $derived(selectedFrameIds.size > 1);
  let selectedFrames = $derived(frames.filter((f) => selectedFrameIds.has(f.id)));
  let pickerHex = $state("#000000");
  let isBackgroundPickerOpen = $state(false);
  let isPickerUserInput = $state(false);
  let previousSelectionKey = $state("");
  let selectionKey = $derived(Array.from(selectedFrameIds).join("|"));

  let frameIndicator = $derived.by(() => {
    if (!selectedFrameId || frames.length === 0) return "";
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

  let backgroundColourValue = $derived.by(() => {
    if (selectedFrames.length === 0) return "";
    const colours = new Set(selectedFrames.map((f) => f.backgroundColour ?? "#000000"));
    return colours.size === 1 ? (selectedFrames[0].backgroundColour ?? "#000000") : "";
  });

  let backgroundColourPlaceholder = $derived.by(() => {
    if (!isMultiSelect) return "";
    const colours = new Set(selectedFrames.map((f) => f.backgroundColour ?? "#000000"));
    return colours.size === 1 ? "" : "Mixed";
  });

  function frameFillsCanvas(frame: Frame): boolean {
    const bounds = frame.contentBounds;
    return (
      !bounds ||
      (bounds.x === 0 &&
        bounds.y === 0 &&
        bounds.width === frame.width &&
        bounds.height === frame.height)
    );
  }

  let backgroundColourHelper = $derived.by(() => {
    if (selectedFrames.length === 0) return "";
    return selectedFrames.every(frameFillsCanvas)
      ? "The selected frame(s) fill(s) the canvas, so the background colour has no visible effect."
      : "";
  });

  $effect(() => {
    if (previousSelectionKey && selectionKey !== previousSelectionKey) {
      isBackgroundPickerOpen = false;
      isPickerUserInput = false;
    }
    previousSelectionKey = selectionKey;
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

  function openBackgroundPicker() {
    pickerHex = backgroundColourValue || "#000000";
    isPickerUserInput = false;
    isBackgroundPickerOpen = true;
  }

  function toggleBackgroundPicker() {
    if (isBackgroundPickerOpen) {
      isBackgroundPickerOpen = false;
      isPickerUserInput = false;
    } else {
      openBackgroundPicker();
    }
  }

  function setBackgroundColour(colour: string | null | undefined) {
    if (!colour || !/^#[0-9a-fA-F]{6}$/.test(colour)) return;
    const normalised = colour.toLowerCase();
    pickerHex = normalised;
    frameStore.setFrameBackgroundColour(normalised);
  }

  function handleBackgroundColourInput(event: Event) {
    openBackgroundPicker();
    setBackgroundColour((event.target as HTMLInputElement).value);
  }

  function eventTargetIsBackgroundPicker(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      Boolean(target.closest('[data-testid="inspector-background-colour-picker"]'))
    );
  }

  function handlePickerInput(event: { hex: string | null }) {
    if (!isPickerUserInput) return;
    setBackgroundColour(event.hex);
  }

  function handleWindowPointerDown(event: PointerEvent) {
    if (eventTargetIsBackgroundPicker(event.target)) {
      isPickerUserInput = true;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isBackgroundPickerOpen) {
      isBackgroundPickerOpen = false;
      isPickerUserInput = false;
      return;
    }
    if (eventTargetIsBackgroundPicker(event.target)) {
      isPickerUserInput = true;
    }
  }
</script>

<svelte:window onpointerdown={handleWindowPointerDown} onkeydown={handleWindowKeydown} />

<aside
  class="inspector"
  class:minimised
  data-testid="inspector"
  style:--inspector-right-inset={`${INSPECTOR_LAYOUT.rightInset}px`}
  style:--inspector-expanded-width={`${INSPECTOR_LAYOUT.expandedWidth}px`}
  style:--inspector-minimised-width={`${INSPECTOR_LAYOUT.minimisedWidth}px`}
>
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

        <div class="background-colour" data-testid="inspector-background-colour">
          <label class="background-colour-label" for="inspector-background-colour-input"
            >Background:</label
          >
          <div
            class="background-colour-input-wrap"
            class:mixed={backgroundColourPlaceholder === "Mixed"}
            style:--background-colour-preview={backgroundColourValue || "transparent"}
            data-background-colour-mixed={backgroundColourPlaceholder === "Mixed"}
            data-testid="inspector-background-colour-preview"
          >
            <input
              id="inspector-background-colour-input"
              class="background-colour-input"
              type="text"
              inputmode="text"
              pattern="#[0-9a-fA-F]{6}"
              value={backgroundColourValue}
              placeholder={backgroundColourPlaceholder}
              data-testid="inspector-background-colour-input"
              onfocus={openBackgroundPicker}
              onclick={openBackgroundPicker}
              oninput={handleBackgroundColourInput}
            />
          </div>
          <button
            class="background-colour-picker-toggle"
            type="button"
            aria-controls="inspector-background-colour-picker"
            aria-expanded={isBackgroundPickerOpen}
            data-testid="inspector-background-colour-picker-toggle"
            onclick={toggleBackgroundPicker}
          >
            {isBackgroundPickerOpen ? "Hide picker" : "Show picker"}
          </button>
          {#if isBackgroundPickerOpen}
            <div
              id="inspector-background-colour-picker"
              class="background-colour-picker"
              data-testid="inspector-background-colour-picker"
            >
              <ColorPicker
                hex={pickerHex}
                isDialog={false}
                isAlpha={false}
                isTextInput={false}
                sliderDirection="horizontal"
                label="Background colour"
                onInput={handlePickerInput}
              />
            </div>
          {/if}
          {#if backgroundColourHelper}
            <p class="background-colour-helper" data-testid="inspector-background-colour-helper">
              {backgroundColourHelper}
            </p>
          {/if}
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

        <div class="bottom-actions">
          <div class="move-buttons" data-testid="inspector-move-buttons">
            <button
              onclick={() => frameStore.moveSelectedFramesToStart()}
              data-testid="inspector-btn-move-start"
              title="Move selected frame(s) to start"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="3" x2="3" y2="13" />
                <line x1="12" y1="8" x2="5" y2="8" />
                <polyline points="8,5 5,8 8,11" />
              </svg>
            </button>
            <button
              onclick={() => frameStore.moveSelectedFrameLeft()}
              data-testid="inspector-btn-move-left"
              title="Move selected frame(s) left"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="13" y1="8" x2="4" y2="8" />
                <polyline points="7,5 4,8 7,11" />
              </svg>
            </button>
            <button
              onclick={() => frameStore.moveSelectedFrameRight()}
              data-testid="inspector-btn-move-right"
              title="Move selected frame(s) right"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="8" x2="12" y2="8" />
                <polyline points="9,5 12,8 9,11" />
              </svg>
            </button>
            <button
              onclick={() => frameStore.moveSelectedFramesToEnd()}
              data-testid="inspector-btn-move-end"
              title="Move selected frame(s) to end"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="13" y1="3" x2="13" y2="13" />
                <line x1="4" y1="8" x2="11" y2="8" />
                <polyline points="8,5 11,8 8,11" />
              </svg>
            </button>
          </div>

          <div class="action-buttons" data-testid="inspector-actions">
            <button
              onclick={() => frameStore.duplicateSelectedFrames()}
              data-testid="inspector-btn-duplicate"
              title="Duplicate selected frame(s)"
            >
              <!-- Duplicate icon: two overlapping squares -->
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
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
    right: var(--inspector-right-inset);
    top: 20px;
    bottom: 20px;
    width: var(--inspector-expanded-width);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 5;
  }

  .inspector.minimised {
    width: var(--inspector-minimised-width);
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

  .background-colour {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .background-colour-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .background-colour-input-wrap {
    position: relative;
    width: 100%;
  }

  .background-colour-input-wrap::before {
    content: "";
    position: absolute;
    left: 1px;
    top: 1px;
    bottom: 1px;
    width: 30px;
    border-right: 1px solid var(--color-border);
    border-radius: 3px 0 0 3px;
    background: var(--background-colour-preview);
    pointer-events: none;
  }

  .background-colour-input-wrap.mixed::before {
    background: repeating-linear-gradient(
      45deg,
      var(--color-surface),
      var(--color-surface) 4px,
      var(--color-border) 4px,
      var(--color-border) 8px
    );
  }

  .background-colour-input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 5px 8px 5px 40px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 13px;
  }

  .background-colour-input:focus {
    outline: none;
    border-color: var(--color-text-muted);
  }

  .background-colour-picker-toggle {
    width: 100%;
    box-sizing: border-box;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
  }

  .background-colour-picker-toggle:hover,
  .background-colour-picker-toggle:focus-visible {
    outline: none;
    background: var(--color-border);
  }

  .background-colour-picker {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    color: var(--color-text-brightest);
    --cp-bg-color: var(--color-bg-elevated);
    --cp-border-color: var(--color-border);
    --cp-text-color: var(--color-text-brightest);
    --picker-width: 100%;
    --picker-height: 166px;
    --slider-width: 18px;
  }

  .background-colour-picker :global(.color-picker) {
    display: block;
    width: 100%;
  }

  .background-colour-picker :global(.wrapper) {
    box-sizing: border-box;
    display: block;
    width: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .background-colour-picker :global(.horizontal .h) {
    width: 100%;
    margin: 10px 0 0;
    --track-width: 100%;
  }

  .background-colour-helper {
    margin: 0;
    font-size: 12px;
    line-height: 1.35;
    color: var(--color-text-muted);
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

  .bottom-actions {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .move-buttons,
  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .move-buttons button,
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

  .move-buttons button:hover,
  .action-buttons button:hover {
    background: var(--color-border);
  }
</style>
