<script lang="ts">
  import type { HelpKeyBinding } from "$lib/help-keybindings";

  interface Props {
    version: string;
    keyBindings: HelpKeyBinding[];
    onClose: () => void;
    onOpenGitHub: () => void;
  }

  let { version, keyBindings, onClose, onOpenGitHub }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="help-menu-backdrop"
  onclick={onClose}
  role="presentation"
  data-testid="help-menu-backdrop"
>
  <div
    class="help-menu"
    onclick={(event) => event.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-menu-title"
    tabindex="-1"
    data-testid="help-menu"
  >
    <div class="help-menu-header">
      <div>
        <p class="help-menu-eyebrow">Help</p>
        <h2 id="help-menu-title">Screeny</h2>
      </div>
      <button
        class="help-menu-close"
        onclick={onClose}
        aria-label="Close help menu"
        data-testid="help-menu-close"
      >
        ×
      </button>
    </div>

    <section class="help-menu-section">
      <p class="help-version" data-testid="help-version">Version {version}</p>
    </section>

    <section class="help-menu-section help-github-section">
      <div class="help-github-copy">
        <h3>Get help or raise an issue</h3>
        <p>Use GitHub for help, bug reports, and feature requests.</p>
      </div>
      <button class="help-github-button" onclick={onOpenGitHub} data-testid="help-github-button">
        <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38
            0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
            -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
            -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21
            2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82
            2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
        <span>GitHub</span>
      </button>
    </section>

    <section class="help-menu-section">
      <h3>Bindings</h3>
      <div class="help-keybindings-wrap">
        <table data-testid="help-keybindings-table">
          <thead>
            <tr>
              <th data-testid="help-keybindings-header-context">Context</th>
              <th data-testid="help-keybindings-header-binding">Binding</th>
              <th data-testid="help-keybindings-header-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each keyBindings as keyBinding}
              <tr>
                <td>{keyBinding.context}</td>
                <td><code>{keyBinding.binding}</code></td>
                <td>{keyBinding.action}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </div>
</div>

<style>
  .help-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.25);
  }

  .help-menu {
    position: fixed;
    top: 56px;
    right: 16px;
    width: min(760px, calc(100vw - 32px));
    max-height: min(70vh, 720px);
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-bg-elevated);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .help-menu-header,
  .help-github-section {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .help-menu-eyebrow {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }

  h2,
  h3 {
    font-size: 18px;
    color: var(--color-text-brightest);
  }

  h3 {
    font-size: 16px;
    margin-bottom: 6px;
  }

  p {
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .help-version {
    color: var(--color-text-muted);
  }

  .help-menu-close,
  .help-github-button {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    cursor: pointer;
  }

  .help-menu-close:hover,
  .help-github-button:hover {
    background: var(--color-border);
    border-color: var(--color-text-muted);
  }

  .help-menu-close {
    width: 36px;
    height: 36px;
    font-size: 20px;
    line-height: 1;
  }

  .help-github-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .help-keybindings-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 560px;
  }

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
  }

  th {
    font-size: 13px;
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  }

  td {
    color: var(--color-text-brightest);
    font-size: 14px;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
    font-size: 13px;
    color: var(--color-text-brightest);
  }
</style>
