<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";

  interface DirEntry {
    name: string;
    path: string;
    is_dir: boolean;
    extension: string | null;
  }

  let {
    onConfirm,
    onCancel,
  }: {
    onConfirm: (path: string) => void;
    onCancel: () => void;
  } = $props();

  let currentPath = $state("");
  let navigatePath = $state("");
  let entries = $state<DirEntry[]>([]);
  let selectedPath = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);

  async function loadDir(path: string) {
    try {
      const result = await invoke<DirEntry[]>("list_dir", { path });
      currentPath = path;
      navigatePath = path;
      entries = result;
      selectedPath = null;
      errorMessage = null;
    } catch (e) {
      errorMessage = String(e);
    }
  }

  function goUp() {
    const lastSep = currentPath.lastIndexOf("/");
    const parent = lastSep > 0 ? currentPath.slice(0, lastSep) : "/";
    loadDir(parent);
  }

  function handleEntryClick(entry: DirEntry) {
    if (entry.is_dir) {
      loadDir(entry.path);
    } else {
      selectedPath = entry.path;
    }
  }

  function handleNavigateKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      loadDir(navigatePath);
    }
  }

  function handleConfirm() {
    if (selectedPath) {
      onConfirm(selectedPath);
    }
  }

  // Load home directory on mount
  $effect(() => {
    invoke<string>("home_dir").then((home) => loadDir(home));
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onCancel} data-testid="file-picker-backdrop"></div>

<div class="picker" data-testid="file-picker" role="dialog" aria-label="Open file">
  <div class="picker-header">
    <button class="btn-up" onclick={goUp} title="Go up" aria-label="Go to parent directory">↑</button>
    <input
      type="text"
      class="navigate-input"
      bind:value={navigatePath}
      onkeydown={handleNavigateKeydown}
      data-testid="file-picker-navigate"
      aria-label="Current directory path"
    />
    <button class="btn-nav" onclick={() => loadDir(navigatePath)} data-testid="file-picker-go">Go</button>
  </div>

  {#if errorMessage}
    <div class="error" data-testid="file-picker-error">{errorMessage}</div>
  {/if}

  <ul class="entry-list" role="listbox">
    {#each entries as entry (entry.path)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <li
        role="option"
        aria-selected={selectedPath === entry.path}
        class="entry"
        class:selected={selectedPath === entry.path}
        class:is-dir={entry.is_dir}
        onclick={() => handleEntryClick(entry)}
        data-testid="file-picker-entry-{entry.name}"
      >
        <span class="entry-icon">{entry.is_dir ? "📁" : "🎞"}</span>
        <span class="entry-name">{entry.name}</span>
      </li>
    {/each}
    {#if entries.length === 0 && !errorMessage}
      <li class="empty">No GIF files or folders here</li>
    {/if}
  </ul>

  <div class="picker-footer">
    <button
      class="btn-confirm"
      onclick={handleConfirm}
      disabled={!selectedPath}
      data-testid="file-picker-confirm"
    >
      Open
    </button>
    <button class="btn-cancel" onclick={onCancel} data-testid="file-picker-cancel">Cancel</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .picker {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    width: 560px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
  }

  .picker-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .navigate-input {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 13px;
    min-width: 0;
  }

  .navigate-input:focus {
    outline: none;
    border-color: var(--color-text-muted);
  }

  .error {
    padding: 8px 12px;
    color: #e06c75;
    font-size: 13px;
    background: rgba(224, 108, 117, 0.1);
    border-bottom: 1px solid var(--color-border);
  }

  .entry-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    overflow-y: auto;
    height: 320px;
  }

  .entry {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    cursor: pointer;
    color: var(--color-text-brightest);
    font-size: 14px;
    user-select: none;
  }

  .entry:hover {
    background: var(--color-border);
  }

  .entry.selected {
    background: var(--color-surface);
    outline: 1px solid var(--color-text-muted);
  }

  .entry-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .entry-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    padding: 12px;
    color: var(--color-text-muted);
    font-size: 13px;
    font-style: italic;
  }

  .picker-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--color-border);
  }

  button {
    padding: 6px 16px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 14px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: var(--color-border);
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-up {
    padding: 5px 10px;
    font-size: 16px;
    flex-shrink: 0;
  }

  .btn-nav {
    padding: 5px 10px;
    font-size: 13px;
    flex-shrink: 0;
  }

  .btn-confirm {
    background: var(--color-surface);
  }
</style>
