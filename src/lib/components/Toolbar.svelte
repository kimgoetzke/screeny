<script lang="ts">
  import { Channel, invoke } from "@tauri-apps/api/core";
  import { frameStore } from "$lib/stores/frames.svelte";
  import { openGifStreaming, exportGif } from "$lib/actions";
  import type { DialogProvider, GifBackend } from "$lib/actions";
  import type { DecodeEvent } from "$lib/types";
  import FilePicker from "$lib/components/FilePicker.svelte";
  import NotificationDialog from "$lib/components/NotificationDialog.svelte";

  let { onLoad }: { onLoad?: () => void } = $props();

  let loading = $state(false);
  let statusMessage = $state("");
  let isE2e = $state(false);

  let showFilePicker = $state(false);
  let filePickerResolve: ((path: string | null) => void) | null = null;
  let filePickerReject: ((error: unknown) => void) | null = null;

  let showCloseConfirm = $state(false);

  let showSaveInput = $state(false);
  let savePath = $state("");
  let saveResolve: ((path: string | null) => void) | null = null;

  invoke<boolean>("e2e_check").then((result) => {
    isE2e = result;
  });

  const nativeDialog: DialogProvider = {
    openFile: () =>
      new Promise((resolve, reject) => {
        filePickerResolve = resolve;
        filePickerReject = reject;
        showFilePicker = true;
      }),

    saveFile: async () => {
      const suggested: string = await invoke("suggest_export_path");
      savePath = suggested;
      showSaveInput = true;
      return new Promise((resolve) => {
        saveResolve = resolve;
      });
    },
  };

  function handleFilePickerConfirm(path: string) {
    showFilePicker = false;
    filePickerResolve?.(path);
    filePickerResolve = null;
    filePickerReject = null;
  }

  function handleFilePickerCancel() {
    showFilePicker = false;
    filePickerResolve?.(null);
    filePickerResolve = null;
    filePickerReject = null;
  }

  // E2E: open uses the native file picker path; only save is bypassed
  function getDialog(): DialogProvider {
    return {
      openFile: nativeDialog.openFile,
      saveFile: isE2e ? () => invoke("e2e_save_path") : nativeDialog.saveFile,
    };
  }

  const backend: GifBackend = {
    decodeStreaming: async (path, onFrame, onProgress) => {
      const channel = new Channel<DecodeEvent>();
      channel.onmessage = (event) => {
        if (event.type === "frame") {
          onFrame(event.data);
        } else if (event.type === "progress") {
          const percentage = Math.round((event.data.bytesRead / event.data.totalBytes) * 100);
          onProgress(percentage);
        }
      };
      await invoke("decode_gif_stream", { path, onEvent: channel });
    },
    export: (frames, path) => invoke("export_gif", { frames, path }),
  };

  async function handleOpen() {
    loading = true;
    statusMessage = "";
    frameStore.startLoading();
    try {
      const result = await openGifStreaming(
        getDialog(),
        backend,
        (frame) => frameStore.addFrame(frame),
        (progress) => frameStore.setLoadingProgress(progress),
      );
      if (result.error) {
        statusMessage = result.error;
      } else {
        statusMessage = result.message ?? "";
        onLoad?.();
      }
    } finally {
      frameStore.finishLoading();
      loading = false;
    }
  }

  async function handleExport() {
    loading = true;
    statusMessage = "Exporting…";
    try {
      const result = await exportGif(getDialog(), backend, frameStore.frames);
      if (result.error) {
        statusMessage = result.error;
      } else if (result.message) {
        statusMessage = result.message;
      } else {
        statusMessage = "";
      }
    } finally {
      loading = false;
    }
  }

  function confirmSave() {
    showSaveInput = false;
    saveResolve?.(savePath || null);
    saveResolve = null;
  }

  function cancelSave() {
    showSaveInput = false;
    saveResolve?.(null);
    saveResolve = null;
  }

  function handleClose() {
    showCloseConfirm = true;
  }

  function confirmClose() {
    frameStore.clear();
    showCloseConfirm = false;
  }

  function cancelClose() {
    showCloseConfirm = false;
  }
</script>

{#if showFilePicker}
  <FilePicker onConfirm={handleFilePickerConfirm} onCancel={handleFilePickerCancel} />
{/if}

{#if showCloseConfirm}
  <NotificationDialog
    message={"Any unsaved changes will be lost.\nDo you want to continue?"}
    confirmLabel="Continue"
    cancelLabel="Cancel"
    onConfirm={confirmClose}
    onCancel={cancelClose}
  />
{/if}

<div class="toolbar" data-testid="toolbar">
  <div class="toolbar-actions">
    {#if frameStore.hasFrames}
      <button onclick={handleClose} disabled={loading} data-testid="btn-close">Close</button>
    {:else}
      <button onclick={handleOpen} disabled={loading} data-testid="btn-open">Open</button>
    {/if}
    <button
      onclick={handleExport}
      disabled={loading || !frameStore.hasFrames}
      data-testid="btn-export"
    >
      Export
    </button>
    {#if frameStore.hasFrames}
      <button
        class="icon-btn"
        onclick={() => frameStore.play()}
        disabled={frameStore.isPlaying}
        data-testid="btn-play"
        title="Play"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <polygon points="3,2 13,8 3,14" fill="currentColor" />
        </svg>
      </button>
      <button
        class="icon-btn"
        onclick={() => frameStore.stop()}
        disabled={!frameStore.isPlaying}
        data-testid="btn-stop"
        title="Stop"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="3" y="3" width="10" height="10" fill="currentColor" />
        </svg>
      </button>
    {/if}
  </div>
  {#if showSaveInput}
    <div class="save-input-row" data-testid="save-input-row">
      <input
        type="text"
        bind:value={savePath}
        placeholder="~/export.gif"
        data-testid="save-path-input"
        onkeydown={(e) => {
          if (e.key === "Enter") confirmSave();
          if (e.key === "Escape") cancelSave();
        }}
      />
      <button onclick={confirmSave} data-testid="btn-save-confirm">Save</button>
      <button onclick={cancelSave} data-testid="btn-save-cancel">Cancel</button>
    </div>
  {:else if frameStore.isLoading}
    <div class="loading-progress" data-testid="loading-progress">
      <div class="progress-track">
        <div class="progress-fill" style="width: {frameStore.loadingProgress ?? 0}%"></div>
      </div>
      <span class="progress-label">
        Loading{frameStore.loadingProgress !== null ? ` ${frameStore.loadingProgress}%` : ""}
        {#if frameStore.frames.length > 0}
          &nbsp;({frameStore.frames.length} frames)
        {/if}
      </span>
    </div>
  {:else if statusMessage}
    <span class="status" data-testid="status-message">{statusMessage}</span>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 16px;
    background: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .toolbar-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .icon-btn {
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button {
    padding: 8px 20px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 15px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: var(--color-border);
    border-color: var(--color-text-muted);
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .status {
    font-size: 14px;
    color: var(--color-text-muted);
    padding: 4px 8px;
  }

  .save-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .save-input-row input[type="text"] {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
    color: var(--color-text-brightest);
    font-size: 14px;
    min-width: 0;
  }

  .save-input-row input[type="text"]:focus {
    outline: none;
    border-color: var(--color-text-muted);
  }

  .save-input-row button {
    padding: 6px 14px;
    font-size: 14px;
  }

  .loading-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .progress-track {
    flex: 1;
    height: 6px;
    background: var(--color-border);
    border-radius: 3px;
    overflow: hidden;
    min-width: 0;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 3px;
    transition: width 0.1s ease;
  }

  .progress-label {
    font-size: 13px;
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
