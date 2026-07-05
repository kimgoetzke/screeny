import type { Frame } from "$lib/types";

export interface Dimensions {
  width: number;
  height: number;
}

const BLACK_RGBA = [0, 0, 0, 255] as const;

function decodeBase64Bytes(imageData: string): Uint8Array {
  const raw = atob(imageData);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function encodeBase64Bytes(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function aspectRatiosDiffer(a: Dimensions, b: Dimensions): boolean {
  return a.width * b.height !== b.width * a.height;
}

export function normaliseFrameToDimensions(frame: Frame, target: Dimensions): Frame {
  const source = decodeBase64Bytes(frame.imageData);
  const output = new Uint8Array(target.width * target.height * 4);

  for (let index = 0; index < output.length; index += 4) {
    output[index] = BLACK_RGBA[0];
    output[index + 1] = BLACK_RGBA[1];
    output[index + 2] = BLACK_RGBA[2];
    output[index + 3] = BLACK_RGBA[3];
  }

  const copyWidth = Math.min(frame.width, target.width);
  const copyHeight = Math.min(frame.height, target.height);
  const sourceStartX = Math.max(0, Math.floor((frame.width - target.width) / 2));
  const sourceStartY = Math.max(0, Math.floor((frame.height - target.height) / 2));
  const targetStartX = Math.max(0, Math.floor((target.width - frame.width) / 2));
  const targetStartY = Math.max(0, Math.floor((target.height - frame.height) / 2));

  for (let y = 0; y < copyHeight; y += 1) {
    for (let x = 0; x < copyWidth; x += 1) {
      const sourceIndex = ((sourceStartY + y) * frame.width + sourceStartX + x) * 4;
      const targetIndex = ((targetStartY + y) * target.width + targetStartX + x) * 4;
      output[targetIndex] = source[sourceIndex];
      output[targetIndex + 1] = source[sourceIndex + 1];
      output[targetIndex + 2] = source[sourceIndex + 2];
      output[targetIndex + 3] = source[sourceIndex + 3];
    }
  }

  return {
    ...frame,
    width: target.width,
    height: target.height,
    imageData: encodeBase64Bytes(output),
  };
}
