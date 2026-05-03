import type { Frame } from "$lib/types";

export function renderFrameToCanvas(canvas: HTMLCanvasElement, frame: Frame): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rawBytes = atob(frame.imageData);
  const uint8 = new Uint8ClampedArray(rawBytes.length);
  for (let i = 0; i < rawBytes.length; i++) {
    uint8[i] = rawBytes.charCodeAt(i);
  }
  canvas.width = frame.width;
  canvas.height = frame.height;
  ctx.putImageData(new ImageData(uint8, frame.width, frame.height), 0, 0);
}
