import { decodeGifPathStreaming, decodeImportPath } from "$lib/actions";
import type { ActionResult, GifBackend, OpenGifStreamingOptions } from "$lib/actions";
import type { DecodeStart, Frame } from "$lib/types";

export type DecodeLifecycleMode = "gif" | "import";

export interface DecodeLifecycleOptions {
  mode: DecodeLifecycleMode;
  path: string;
  backend: GifBackend;
  beforeDecode?: () => Promise<void> | void;
  onStart?: (start: DecodeStart) => void;
  onFrame: (frame: Frame) => void;
  onProgress: (progress: number) => void;
  onFirstFrame?: (frame: Frame) => Promise<void> | void;
  isCurrent: () => boolean;
}

export async function decodeWithLifecycle(options: DecodeLifecycleOptions): Promise<ActionResult> {
  const decoder = options.mode === "import" ? decodeImportPath : decodeGifPathStreaming;
  const decodeOptions: OpenGifStreamingOptions = {
    beforeDecode: options.beforeDecode,
    onStart: (start) => {
      if (!options.isCurrent()) return;
      options.onStart?.(start);
    },
    onFirstFrame: async (frame) => {
      if (!options.isCurrent()) return;
      await options.onFirstFrame?.(frame);
    },
    isCancelled: () => !options.isCurrent(),
  };

  return decoder(
    options.path,
    options.backend,
    (frame) => {
      if (!options.isCurrent()) return;
      options.onFrame(frame);
    },
    (progress) => {
      if (!options.isCurrent()) return;
      options.onProgress(progress);
    },
    decodeOptions,
  );
}
