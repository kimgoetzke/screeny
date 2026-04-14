<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { frameStore } from "$lib/stores/frames.svelte";
  import { openGif, exportGif } from "$lib/actions";
  import type { DialogProvider, GifBackend } from "$lib/actions";
  import FilePicker from "$lib/components/FilePicker.svelte";

  let loading = $state(false);
  let statusMessage = $state("");
  let isE2e = $state(false);

  let showFilePicker = $state(false);
  let filePickerResolve: ((result: Uint8Array | null) => void) | null = null;
  let filePickerReject: ((error: unknown) => void) | null = null;

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

  async function handleFilePickerConfirm(path: string) {
    showFilePicker = false;
    if (!filePickerResolve) return;
    try {
      const bytes: number[] = await invoke("read_file_bytes", { path });
      filePickerResolve(new Uint8Array(bytes));
    } catch (error) {
      filePickerReject?.(error);
    }
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
    decode: (data) => invoke("decode_gif_bytes", { data: Array.from(data) }),
    export: (frames, path) => invoke("export_gif", { frames, path }),
  };

  async function handleOpen() {
    loading = true;
    statusMessage = "Opening…";
    try {
      const result = await openGif(getDialog(), backend);
      if (result.error) {
        statusMessage = result.error;
      } else if (result.frames) {
        frameStore.setFrames(result.frames);
        statusMessage = result.message ?? "";
      } else {
        statusMessage = "";
      }
    } finally {
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
</script>

{#if showFilePicker}
  <FilePicker onConfirm={handleFilePickerConfirm} onCancel={handleFilePickerCancel} />
{/if}

<div class="toolbar" data-testid="toolbar">
  <div class="toolbar-actions">
    <button onclick={handleOpen} disabled={loading} data-testid="btn-open">Open</button>
    <button
      onclick={handleExport}
      disabled={loading || !frameStore.hasFrames}
      data-testid="btn-export"
    >
      Export
    </button>
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
</style>
