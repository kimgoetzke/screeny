import { aspectRatiosDiffer, normaliseFrameToDimensions } from "$lib/import/importFrames";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

export interface ImportTransactionResult {
  importedFrameCount: number;
  hasAspectRatioMismatch: boolean;
}

export interface ImportTransaction {
  addFrame(frame: Frame): void;
  commit(): ImportTransactionResult;
}

interface ImportTarget {
  frameId: string;
  width: number;
  height: number;
}

export function createImportTransaction(targetFrame: Frame): ImportTransaction {
  const target: ImportTarget = {
    frameId: targetFrame.id,
    width: targetFrame.width,
    height: targetFrame.height,
  };
  const importedFrames: Frame[] = [];

  return {
    addFrame(frame: Frame): void {
      importedFrames.push(frame);
    },

    commit(): ImportTransactionResult {
      const hasAspectRatioMismatch = importedFrames.some((frame) => aspectRatiosDiffer(frame, target));
      const normalisedFrames = importedFrames.map((frame) => normaliseFrameToDimensions(frame, target));
      frameStore.insertFramesAfterFrameId(target.frameId, normalisedFrames);

      return {
        importedFrameCount: normalisedFrames.length,
        hasAspectRatioMismatch,
      };
    },
  };
}
