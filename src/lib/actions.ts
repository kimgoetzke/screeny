import type { DecodeStart, ExportFrame, Frame } from "$lib/types";

export interface DialogProvider {
  openFile(): Promise<string | null>;
  saveFile(): Promise<string | null>;
}

export interface GifBackend {
  decodeStreaming(
    path: string,
    onStart: (start: DecodeStart) => void,
    onFrame: (frame: Frame) => void,
    onProgress: (progress: number) => void,
  ): Promise<void>;
  export(frames: ExportFrame[], path: string): Promise<void>;
}

export interface ActionResult {
  message?: string;
  error?: string;
}

export interface OpenGifStreamingOptions {
  beforeDecode?: () => Promise<void> | void;
  onStart?: (start: DecodeStart) => void;
  onFirstFrame?: (frame: Frame) => Promise<void> | void;
  isCancelled?: () => boolean;
}

export async function decodeGifPathStreaming(
  path: string,
  backend: GifBackend,
  onFrame: (frame: Frame) => void,
  onProgress: (progress: number) => void,
  options: OpenGifStreamingOptions = {},
): Promise<ActionResult> {
  let frameCount = 0;
  try {
    await options.beforeDecode?.();
    await backend.decodeStreaming(
      path,
      (start) => {
        options.onStart?.(start);
      },
      (frame) => {
        if (options.isCancelled?.()) return;
        frameCount++;
        onFrame(frame);
        if (frameCount === 1) {
          void options.onFirstFrame?.(frame);
        }
      },
      onProgress,
    );
    if (options.isCancelled?.()) return {};
    return { message: `Loaded ${frameCount} frames` };
  } catch (error) {
    if (options.isCancelled?.()) return {};
    return { error: `Failed to decode GIF: ${error}` };
  }
}

export async function openGifStreaming(
  dialog: DialogProvider,
  backend: GifBackend,
  onFrame: (frame: Frame) => void,
  onProgress: (progress: number) => void,
  options: OpenGifStreamingOptions = {},
): Promise<ActionResult> {
  let path: string | null;
  try {
    path = await dialog.openFile();
  } catch (error) {
    return { error: `Failed to open file dialog: ${error}` };
  }

  if (!path) return {};

  return decodeGifPathStreaming(path, backend, onFrame, onProgress, options);
}

export async function exportGif(
  dialog: DialogProvider,
  backend: GifBackend,
  frames: Frame[],
): Promise<ActionResult> {
  if (frames.length === 0) {
    return { error: "No frames to export" };
  }

  let path: string | null;
  try {
    path = await dialog.saveFile();
  } catch (error) {
    return { error: `Failed to open save dialog: ${error}` };
  }

  if (!path) return {};

  const exportFrames: ExportFrame[] = frames.map((f) => ({
    imageData: f.imageData,
    duration: f.duration,
    width: f.width,
    height: f.height,
  }));

  try {
    await backend.export(exportFrames, path);
    return { message: "Exported successfully" };
  } catch (error) {
    return { error: `Failed to export GIF: ${error}` };
  }
}
