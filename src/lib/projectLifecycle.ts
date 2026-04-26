import { invoke } from "@tauri-apps/api/core";
import { openGifStreaming, exportGif } from "$lib/actions";
import type { DialogProvider, GifBackend } from "$lib/actions";
import { frameStore } from "$lib/stores/frames.svelte";
import { waitForNextPaint } from "$lib/paint";

export interface ProjectLifecycleOptions {
  getDialog: () => DialogProvider;
  backend: GifBackend;
  onLoad?: () => Promise<void> | void;
  onLoadingChange: (loading: boolean) => void;
  onStatusChange: (message: string) => void;
  /** Returns the ID of the most recently started decode, for cancellation. */
  getDecodeId: () => number;
}

export function createProjectLifecycle(options: ProjectLifecycleOptions) {
  let openCallId = 0;

  async function handleOpen() {
    const myCallId = ++openCallId;
    options.onLoadingChange(true);
    options.onStatusChange("");
    let sessionAtStart: number;
    try {
      const result = await openGifStreaming(
        options.getDialog(),
        options.backend,
        (frame) => {
          if (frameStore.loadSessionId === sessionAtStart) {
            frameStore.addFrame(frame);
          }
        },
        (progress) => frameStore.setLoadingProgress(progress),
        {
          beforeDecode: async () => {
            frameStore.startLoading();
            sessionAtStart = frameStore.loadSessionId;
            await waitForNextPaint();
          },
          onStart: (start) => {
            frameStore.setLoadingTotalFrames(start.totalFrames);
          },
          onFirstFrame: async () => {
            await options.onLoad?.();
          },
          isCancelled: () => frameStore.loadSessionId !== sessionAtStart,
        },
      );
      if (myCallId !== openCallId) return;
      if (result.error) {
        options.onStatusChange(result.error);
      } else {
        options.onStatusChange(result.message ?? "");
      }
    } finally {
      if (myCallId !== openCallId) return;
      if (frameStore.isLoading) {
        await waitForNextPaint();
        frameStore.finishLoading();
      }
      options.onLoadingChange(false);
    }
  }

  function handleCancelLoad() {
    openCallId++;
    frameStore.cancelLoad();
    options.onLoadingChange(false);
    void invoke("cancel_gif_decode", { decodeId: options.getDecodeId() });
  }

  async function handleExport() {
    options.onLoadingChange(true);
    options.onStatusChange("Exporting…");
    try {
      const result = await exportGif(
        options.getDialog(),
        options.backend,
        frameStore.frames,
      );
      if (result.error) {
        options.onStatusChange(result.error);
      } else if (result.message) {
        options.onStatusChange(result.message);
      } else {
        options.onStatusChange("");
      }
    } finally {
      options.onLoadingChange(false);
    }
  }

  return { handleOpen, handleCancelLoad, handleExport };
}
