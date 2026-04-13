import type { Frame, ExportFrame } from "$lib/types";

export interface DialogProvider {
  openFile(): Promise<Uint8Array | null>;
  saveFile(): Promise<string | null>;
}

export interface GifBackend {
  decode(data: Uint8Array): Promise<Frame[]>;
  export(frames: ExportFrame[], path: string): Promise<void>;
}

export interface ActionResult {
  frames?: Frame[];
  message?: string;
  error?: string;
}

export async function openGif(
  dialog: DialogProvider,
  backend: GifBackend,
): Promise<ActionResult> {
  let data: Uint8Array | null;
  try {
    data = await dialog.openFile();
  } catch (error) {
    return { error: `Failed to open file dialog: ${error}` };
  }

  if (!data) return {};

  try {
    const frames = await backend.decode(data);
    return { frames, message: `Loaded ${frames.length} frames` };
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
