<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { frameStore } from "$lib/stores/frames.svelte";
  import { openGif, exportGif } from "$lib/actions";
  import type { DialogProvider, GifBackend } from "$lib/actions";

  let loading = $state(false);
  let statusMessage = $state("");
  let isE2e = $state(false);

  let fileInput: HTMLInputElement;
  let showSaveInput = $state(false);
  let savePath = $state("");
  let saveResolve: ((path: string | null) => void) | null = null;

  invoke<boolean>("e2e_check").then((result) => {
    isE2e = result;
  });

  const nativeDialog: DialogProvider = {
    openFile: () =>
      new Promise((resolve) => {
        const handleChange = async (event: Event) => {
          cleanup();
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const buffer = await file.arrayBuffer();
          resolve(new Uint8Array(buffer));
          fileInput.value = "";
        };

        const handleCancel = () => {
          cleanup();
          resolve(null);
        };

        function cleanup() {
          fileInput.removeEventListener("change", handleChange);
          fileInput.removeEventListener("cancel", handleCancel);
        }

        fileInput.addEventListener("change", handleChange);
        fileInput.addEventListener("cancel", handleCancel);
        fileInput.click();
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

  const e2eDialog: DialogProvider = {
    openFile: async () => {
      const bytes: number[] | null = await invoke("e2e_open_fixture");
      return bytes ? new Uint8Array(bytes) : null;
    },
    saveFile: () => invoke("e2e_save_path"),
  };

  function getDialog(): DialogProvider {
    return isE2e ? e2eDialog : nativeDialog;
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

<input type="file" accept=".gif" bind:this={fileInput} style="display:none" />

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
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .toolbar-actions {
    display: flex;
    gap: 10px;
  }

  button {
    padding: 8px 20px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #eee;
    font-size: 15px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #3a3a3a;
    border-color: #777;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .status {
    font-size: 14px;
    color: #999;
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
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #eee;
    font-size: 14px;
    min-width: 0;
  }

  .save-input-row input[type="text"]:focus {
    outline: none;
    border-color: #888;
  }

  .save-input-row button {
    padding: 6px 14px;
    font-size: 14px;
  }
</style>
