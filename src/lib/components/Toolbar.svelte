<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { frameStore } from "$lib/stores/frames.svelte";
  import { openGif, exportGif } from "$lib/actions";
  import type { DialogProvider, GifBackend } from "$lib/actions";

  let loading = $state(false);
  let statusMessage = $state("");
  let isE2e = $state(false);

  invoke<boolean>("e2e_check").then((result) => {
    isE2e = result;
  });

  const nativeDialog: DialogProvider = {
    openFile: () => invoke("open_file_dialog"),
    saveFile: () => invoke("save_file_dialog"),
  };

  const e2eDialog: DialogProvider = {
    openFile: () => invoke("e2e_open_fixture"),
    saveFile: () => invoke("e2e_save_path"),
  };

  function getDialog(): DialogProvider {
    return isE2e ? e2eDialog : nativeDialog;
  }

  const backend: GifBackend = {
    decode: (path) => invoke("decode_gif", { path }),
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
</script>

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
  {#if statusMessage}
    <span class="status" data-testid="status-message">{statusMessage}</span>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }

  button {
    padding: 6px 16px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a2a;
    color: #eee;
    font-size: 13px;
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
    font-size: 12px;
    color: #999;
  }
</style>
