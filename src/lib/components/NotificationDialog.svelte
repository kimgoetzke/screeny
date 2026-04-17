<script lang="ts">
  interface Props {
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }

  let { message, confirmLabel, cancelLabel, onConfirm, onCancel }: Props = $props();

  function handleBackdropClick() {
    if (cancelLabel) {
      onCancel?.();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && cancelLabel) {
      onCancel?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="backdrop" onclick={handleBackdropClick} role="presentation" data-testid="dialog-backdrop">
  <div
    class="dialog"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    data-testid="dialog"
  >
    <p class="message" data-testid="dialog-message">{message}</p>
    <div class="buttons">
      {#if cancelLabel}
        <button onclick={onCancel} class="btn-secondary" data-testid="btn-dialog-cancel">
          {cancelLabel}
        </button>
      {/if}
      <button onclick={onConfirm} class="btn-primary" data-testid="btn-dialog-confirm">
        {confirmLabel}
      </button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dialog {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .message {
    font-size: 15px;
    color: var(--color-text-brightest);
    white-space: pre-wrap;
    line-height: 1.5;
  }

  .buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  button {
    padding: 8px 20px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 15px;
    cursor: pointer;
  }

  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-text-brightest);
  }

  .btn-secondary:hover {
    background: var(--color-border);
    border-color: var(--color-text-muted);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .btn-primary:hover {
    opacity: 0.85;
  }
</style>
