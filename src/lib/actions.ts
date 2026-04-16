import type { Frame, ExportFrame } from "$lib/types";

export interface DialogProvider {
  openFile(): Promise<string | null>;
  saveFile(): Promise<string | null>;
}

export interface GifBackend {
  decodeStreaming(
    path: string,
    onFrame: (frame: Frame) => void,
    onProgress: (progress: number) => void,
  ): Promise<void>;
  export(frames: ExportFrame[], path: string): Promise<void>;
}

export interface ActionResult {
  message?: string;
  error?: string;
}

export async function openGifStreaming(
  dialog: DialogProvider,
  backend: GifBackend,
  onFrame: (frame: Frame) => void,
  onProgress: (progress: number) => void,
): Promise<ActionResult> {
  let path: string | null;
  try {
    path = await dialog.openFile();
  } catch (error) {
    return { error: `Failed to open file dialog: ${error}` };
  }

  if (!path) return {};

  let frameCount = 0;
  try {
    await backend.decodeStreaming(
      path,
      (frame) => {
        frameCount++;
        onFrame(frame);
      },
      onProgress,
    );
    return { message: `Loaded ${frameCount} frames` };
  } catch (error) {
    return { error: `Failed to decode GIF: ${error}` };
  }
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
  }));

  try {
    await backend.export(exportFrames, path);
    return { message: "Exported successfully" };
  } catch (error) {
    return { error: `Failed to export GIF: ${error}` };
  }
}
