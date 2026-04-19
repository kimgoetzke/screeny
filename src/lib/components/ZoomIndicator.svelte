<script lang="ts">
  let {
    scale,
    isModified,
    onReset,
    visible,
    rightOffset = 10,
  }: {
    scale: number;
    isModified: boolean;
    onReset: () => void;
    visible: boolean;
    rightOffset?: number;
  } = $props();
</script>

{#if visible}
  <div class="zoom-indicator" data-testid="zoom-indicator" style:right="{rightOffset}px">
    <!-- Magnifying glass icon -->
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
      <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <span data-testid="zoom-level">{Math.round(scale * 100)}%</span>
    {#if isModified}
      <button class="reset-btn" data-testid="zoom-reset" onclick={onReset} title="Reset zoom">
        <!-- Circular reset icon -->
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.418A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  .zoom-indicator {
    position: absolute;
    top: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 12px;
    color: var(--color-text);
    z-index: 20;
    pointer-events: auto;
    user-select: none;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin-left: 2px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 2px;
    transition: color 0.15s;
  }

  .reset-btn:hover {
    color: var(--color-text-brightest);
  }
</style>
