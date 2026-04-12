<script lang="ts">
  import { open, save } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";
  import { frameStore } from "$lib/stores/frames.svelte";
  import type { Frame, ExportFrame } from "$lib/types";

  let loading = $state(false);
  let statusMessage = $state("");

  async function handleOpen() {
    const path = await open({
      filters: [{ name: "GIF", extensions: ["gif"] }],
    });
    if (!path) return;

    loading = true;
    statusMessage = "Decoding GIF…";
    try {
      const frames: Frame[] = await invoke("decode_gif", { path });
      frameStore.setFrames(frames);
      statusMessage = `Loaded ${frames.length} frames`;
    } catch (error) {
      statusMessage = `Error: ${error}`;
    } finally {
      loading = false;
    }
  }

  async function handleExport() {
    if (!frameStore.hasFrames) return;

    const path = await save({
      filters: [{ name: "GIF", extensions: ["gif"] }],
      defaultPath: "export.gif",
    });
    if (!path) return;

    loading = true;
    statusMessage = "Exporting GIF…";
    try {
      const exportFrames: ExportFrame[] = frameStore.frames.map((f) => ({
        imageData: f.imageData,
        duration: f.duration,
      }));
      await invoke("export_gif", { frames: exportFrames, path });
      statusMessage = "Exported successfully";
    } catch (error) {
      statusMessage = `Error: ${error}`;
    } finally {
      loading = false;
    }
  }
</script>

<div class="toolbar">
  <div class="toolbar-actions">
    <button onclick={handleOpen} disabled={loading}>Open</button>
    <button onclick={handleExport} disabled={loading || !frameStore.hasFrames}>
      Export
    </button>
  </div>
  {#if statusMessage}
    <span class="status">{statusMessage}</span>
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
