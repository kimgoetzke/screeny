import { decodeGifPathStreaming, decodeImportPath, exportGif } from "$lib/actions";
import type { ActionResult, DialogProvider, GifBackend } from "$lib/actions";
import { waitForNextPaint } from "$lib/canvas/paint";
import { aspectRatiosDiffer, normaliseFrameToDimensions } from "$lib/import/importFrames";
import { frameStore } from "$lib/stores/frames.svelte";

export type ProjectState = "Empty" | "Loading" | "Active" | "Exporting";

export type ToolbarFeedback =
  | { kind: "none" }
  | { kind: "loading"; label: string; percent: number }
  | { kind: "status"; message: string };

export interface ProjectLifecycleOptions {
  dialog: DialogProvider;
  backend: GifBackend;
  cancelDecode: () => Promise<void> | void;
  onFirstFrame?: () => Promise<void> | void;
}

export interface ProjectLifecycleOpenResult {
  message?: string;
  error?: string;
}

export interface ProjectLifecycle {
  readonly projectState: ProjectState;
  readonly hasProject: boolean;
  readonly closeRequested: boolean;
  readonly toolbarFeedback: ToolbarFeedback;
  readonly aspectRatioWarning: string | null;

  readonly canOpen: boolean;
  readonly canCancel: boolean;
  readonly canClose: boolean;
  readonly canExport: boolean;
  readonly canImport: boolean;

  open(): Promise<void>;
  openFromPath(path: string): Promise<ProjectLifecycleOpenResult>;
  cancel(): Promise<void>;
  requestClose(): void;
  confirmClose(): void;
  dismissClose(): void;
  dismissAspectRatioWarning(): void;
  importFrames(): Promise<void>;
  export(): Promise<void>;
}

function loadingToolbarFeedback(): ToolbarFeedback {
  const totalFrames = frameStore.loadingTotalFrames;
  const loadedFrames = frameStore.loadingFrameCount;

  if (totalFrames !== null && totalFrames > 0 && loadedFrames > 0) {
    const clampedLoadedFrames = Math.min(loadedFrames, totalFrames);
    return {
      kind: "loading",
      label: `Loading frame ${clampedLoadedFrames} of ${totalFrames}`,
      percent: Math.round((clampedLoadedFrames / totalFrames) * 100),
    };
  }

  if (frameStore.loadingProgress !== null && frameStore.loadingProgress > 0) {
    return {
      kind: "loading",
      label: `Loading ${frameStore.loadingProgress}%`,
      percent: frameStore.loadingProgress,
    };
  }

  return {
    kind: "loading",
    label: "Loading...",
    percent: frameStore.loadingProgress ?? 0,
  };
}

function resultToStatus(result: ActionResult): string {
  return result.error ?? result.message ?? "";
}

function importedFrameStatus(count: number): string {
  return count === 1 ? "Imported 1 frame" : `Imported ${count} frames`;
}

export function createProjectLifecycle(options: ProjectLifecycleOptions): ProjectLifecycle {
  let projectState = $state<ProjectState>("Empty");
  let closeRequested = $state(false);
  let statusMessage = $state("");
  let aspectRatioWarning = $state<string | null>(null);
  let openRequestId = 0;

  function setStatus(message: string) {
    statusMessage = message;
  }

  function clearStatus() {
    statusMessage = "";
  }

  function clearAspectRatioWarning(): void {
    aspectRatioWarning = null;
  }

  function dismissAspectRatioWarning(): void {
    clearAspectRatioWarning();
  }

  function clearCloseRequest() {
    closeRequested = false;
  }

  function syncStateFromFrames() {
    projectState = frameStore.hasFrames ? "Active" : "Empty";
  }

  function isCurrentOpen(openId: number, loadSessionId: number): boolean {
    return openRequestId === openId && frameStore.loadSessionId === loadSessionId;
  }

  async function openFromPath(path: string): Promise<ProjectLifecycleOpenResult> {
    const openId = ++openRequestId;
    clearCloseRequest();
    clearAspectRatioWarning();
    clearStatus();
    projectState = "Loading";
    frameStore.startLoading();
    const loadSessionId = frameStore.loadSessionId;

    try {
      const result = await decodeGifPathStreaming(
        path,
        options.backend,
        (frame) => {
          if (!isCurrentOpen(openId, loadSessionId)) return;
          frameStore.addFrame(frame);
        },
        (progress) => {
          if (!isCurrentOpen(openId, loadSessionId)) return;
          frameStore.setLoadingProgress(progress);
        },
        {
          beforeDecode: waitForNextPaint,
          onStart: (start) => {
            if (!isCurrentOpen(openId, loadSessionId)) return;
            frameStore.setLoadingTotalFrames(start.totalFrames);
          },
          onFirstFrame: options.onFirstFrame,
          isCancelled: () => !isCurrentOpen(openId, loadSessionId),
        },
      );

      if (!isCurrentOpen(openId, loadSessionId)) {
        return {};
      }

      return result;
    } finally {
      if (isCurrentOpen(openId, loadSessionId) && frameStore.isLoading) {
        await waitForNextPaint();
        frameStore.finishLoading();
        syncStateFromFrames();
      }
    }
  }

  async function open(): Promise<void> {
    clearCloseRequest();

    let path: string | null;
    try {
      path = await options.dialog.openFile();
    } catch (error) {
      setStatus(`Failed to open file dialog: ${error}`);
      return;
    }

    if (!path) {
      return;
    }

    const result = await openFromPath(path);
    setStatus(resultToStatus(result));
  }

  async function cancel(): Promise<void> {
    if (projectState !== "Loading") {
      return;
    }

    openRequestId += 1;
    clearCloseRequest();
    clearStatus();
    frameStore.cancelLoad();
    projectState = "Empty";
    await options.cancelDecode();
  }

  function requestClose(): void {
    if (projectState !== "Active") {
      return;
    }

    closeRequested = true;
  }

  function confirmClose(): void {
    if (projectState !== "Active" || !closeRequested) {
      return;
    }

    frameStore.clear();
    clearCloseRequest();
    clearAspectRatioWarning();
    clearStatus();
    projectState = "Empty";
  }

  function dismissClose(): void {
    clearCloseRequest();
  }

  async function importFrames(): Promise<void> {
    if (projectState !== "Active" || !frameStore.selectedFrame) {
      return;
    }

    clearCloseRequest();
    clearAspectRatioWarning();
    const targetDimensions = {
      width: frameStore.selectedFrame.width,
      height: frameStore.selectedFrame.height,
    };

    let path: string | null;
    try {
      path = await options.dialog.openFile({
        title: "Import file",
        confirmLabel: "Import",
        emptyLabel: "No importable files or folders here",
        listCommand: "list_import_dir",
      });
    } catch (error) {
      setStatus(`Failed to open file dialog: ${error}`);
      return;
    }

    if (!path) {
      return;
    }

    const importedFrames: typeof frameStore.frames = [];
    setStatus("Importing…");
    const result = await decodeImportPath(
      path,
      options.backend,
      (frame) => importedFrames.push(frame),
      () => {},
      { beforeDecode: waitForNextPaint },
    );

    if (result.error) {
      setStatus(result.error);
      return;
    }

    if (importedFrames.some((frame) => aspectRatiosDiffer(frame, targetDimensions))) {
      aspectRatioWarning = "Imported file has a different aspect ratio and was centred within the current project bounds.";
    }

    const normalisedFrames = importedFrames.map((frame) =>
      normaliseFrameToDimensions(frame, targetDimensions),
    );
    frameStore.insertFramesAfterSelected(normalisedFrames);
    setStatus(importedFrameStatus(normalisedFrames.length));
  }

  async function exportProject(): Promise<void> {
    if (projectState !== "Active" || !frameStore.hasFrames) {
      return;
    }

    clearCloseRequest();
    projectState = "Exporting";
    setStatus("Exporting…");

    try {
      const result = await exportGif(options.dialog, options.backend, frameStore.frames);
      setStatus(resultToStatus(result));
    } finally {
      syncStateFromFrames();
    }
  }

  return {
    get projectState() {
      return projectState;
    },

    get hasProject() {
      return frameStore.hasFrames;
    },

    get closeRequested() {
      return closeRequested;
    },

    get aspectRatioWarning() {
      return aspectRatioWarning;
    },

    get toolbarFeedback(): ToolbarFeedback {
      if (projectState === "Loading") {
        return loadingToolbarFeedback();
      }

      if (statusMessage) {
        return { kind: "status", message: statusMessage };
      }

      return { kind: "none" };
    },

    get canOpen() {
      return projectState === "Empty" || projectState === "Active";
    },

    get canCancel() {
      return projectState === "Loading";
    },

    get canClose() {
      return projectState === "Active";
    },

    get canExport() {
      return projectState === "Active";
    },

    get canImport() {
      return projectState === "Active";
    },

    open,
    openFromPath,
    cancel,
    requestClose,
    confirmClose,
    dismissClose,
    dismissAspectRatioWarning,
    importFrames,
    export: exportProject,
  };
}
