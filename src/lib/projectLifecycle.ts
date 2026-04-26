import { exportGif } from "$lib/actions";
import type { DialogProvider, GifBackend } from "$lib/actions";
import { openProjectFromPath } from "$lib/projectOpen";
import { frameStore } from "$lib/stores/frames.svelte";

export interface ProjectLifecycleOptions {
  getDialog: () => DialogProvider;
  backend: GifBackend;
  onLoad?: () => Promise<void> | void;
  onLoadingChange: (loading: boolean) => void;
  onStatusChange: (message: string) => void;
  cancelDecode: () => Promise<void> | void;
}

export function createProjectLifecycle(options: ProjectLifecycleOptions) {
  let openCallId = 0;

  async function handleOpen() {
    const myCallId = ++openCallId;
    options.onLoadingChange(true);
    options.onStatusChange("");

    try {
      let path: string | null;
      try {
        path = await options.getDialog().openFile();
      } catch (error) {
        if (myCallId === openCallId) {
          options.onStatusChange(`Failed to open file dialog: ${error}`);
        }
        return;
      }

      if (!path || myCallId !== openCallId) return;

      const result = await openProjectFromPath(path, options.backend, {
        onFirstFrame: async () => {
          await options.onLoad?.();
        },
        isCancelled: () => myCallId !== openCallId,
      });

      if (myCallId !== openCallId) return;
      options.onStatusChange(result.error ?? result.message ?? "");
    } finally {
      if (myCallId === openCallId) {
        options.onLoadingChange(false);
      }
    }
  }

  function handleCancelLoad() {
    openCallId++;
    frameStore.cancelLoad();
    options.onLoadingChange(false);
    void options.cancelDecode();
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
