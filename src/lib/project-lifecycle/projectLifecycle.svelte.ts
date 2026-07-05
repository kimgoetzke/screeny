import { exportGif } from "$lib/actions";
import type { ActionResult, DialogProvider, GifBackend } from "$lib/actions";
import { waitForNextPaint } from "$lib/canvas/paint";
import { createDecodeFeedback } from "$lib/project-lifecycle/decodeFeedback";
import type {
  DecodeFeedback,
  DecodeFeedbackVerb,
  ToolbarFeedback,
} from "$lib/project-lifecycle/decodeFeedback";
import { decodeWithLifecycle } from "$lib/project-lifecycle/decodeLifecycle";
export type { ToolbarFeedback } from "$lib/project-lifecycle/decodeFeedback";
import { createImportTransaction } from "$lib/project-lifecycle/importTransaction";
import { frameStore } from "$lib/stores/frames.svelte";

export type ProjectState = "Empty" | "Loading" | "Importing" | "Active" | "Exporting";

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
  let decodeFeedback = $state<DecodeFeedback | null>(null);
  let decodeRequestId = 0;

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

  function startDecodeFeedback(verb: DecodeFeedbackVerb): void {
    decodeFeedback = createDecodeFeedback(verb);
  }

  function clearDecodeFeedback(): void {
    decodeFeedback = null;
  }

  function setDecodeTotalFrames(totalFrames: number): void {
    if (!decodeFeedback) return;
    decodeFeedback = decodeFeedback.started({ totalBytes: 0, totalFrames });
  }

  function incrementDecodeFrameCount(): void {
    if (!decodeFeedback) return;
    decodeFeedback = decodeFeedback.frameDecoded();
  }

  function setDecodeProgress(progress: number): void {
    if (!decodeFeedback) return;
    decodeFeedback = decodeFeedback.progressed(progress);
  }

  function isCurrentDecode(decodeId: number, loadSessionId?: number): boolean {
    return (
      decodeRequestId === decodeId &&
      (loadSessionId === undefined || frameStore.loadSessionId === loadSessionId)
    );
  }

  async function openFromPath(path: string): Promise<ProjectLifecycleOpenResult> {
    const decodeId = ++decodeRequestId;
    clearCloseRequest();
    clearAspectRatioWarning();
    clearStatus();
    projectState = "Loading";
    startDecodeFeedback("Loading");
    frameStore.startLoading();
    const loadSessionId = frameStore.loadSessionId;

    try {
      const result = await decodeWithLifecycle({
        mode: "gif",
        path,
        backend: options.backend,
        beforeDecode: waitForNextPaint,
        onStart: (start) => {
          frameStore.setLoadingTotalFrames(start.totalFrames);
          setDecodeTotalFrames(start.totalFrames);
        },
        onFrame: (frame) => {
          frameStore.addFrame(frame);
          incrementDecodeFrameCount();
        },
        onProgress: (progress) => {
          frameStore.setLoadingProgress(progress);
          setDecodeProgress(progress);
        },
        onFirstFrame: options.onFirstFrame,
        isCurrent: () => isCurrentDecode(decodeId, loadSessionId),
      });

      if (!isCurrentDecode(decodeId, loadSessionId)) {
        return {};
      }

      return result;
    } finally {
      if (isCurrentDecode(decodeId, loadSessionId) && frameStore.isLoading) {
        await waitForNextPaint();
        frameStore.finishLoading();
        clearDecodeFeedback();
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
    if (projectState !== "Loading" && projectState !== "Importing") {
      return;
    }

    const wasImporting = projectState === "Importing";
    decodeRequestId += 1;
    clearCloseRequest();
    clearStatus();
    clearDecodeFeedback();

    if (wasImporting) {
      syncStateFromFrames();
    } else {
      frameStore.cancelLoad();
      projectState = "Empty";
    }

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
    const importTransaction = createImportTransaction(frameStore.selectedFrame);

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

    const decodeId = ++decodeRequestId;
    clearStatus();
    projectState = "Importing";
    startDecodeFeedback("Importing");

    try {
      const result = await decodeWithLifecycle({
        mode: "import",
        path,
        backend: options.backend,
        beforeDecode: waitForNextPaint,
        onStart: (start) => {
          setDecodeTotalFrames(start.totalFrames);
        },
        onFrame: (frame) => {
          importTransaction.addFrame(frame);
          incrementDecodeFrameCount();
        },
        onProgress: setDecodeProgress,
        isCurrent: () => isCurrentDecode(decodeId),
      });

      if (!isCurrentDecode(decodeId)) {
        return;
      }

      if (result.error) {
        setStatus(result.error);
        return;
      }

      const importResult = importTransaction.commit();
      if (importResult.hasAspectRatioMismatch) {
        aspectRatioWarning =
          "Imported file has a different aspect ratio and was centred within the current project bounds.";
      }
      setStatus(importedFrameStatus(importResult.importedFrameCount));
    } finally {
      if (isCurrentDecode(decodeId)) {
        clearDecodeFeedback();
        syncStateFromFrames();
      }
    }
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
      if (decodeFeedback) {
        return decodeFeedback.toToolbarFeedback();
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
      return projectState === "Loading" || projectState === "Importing";
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
