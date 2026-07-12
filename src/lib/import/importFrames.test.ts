import { describe, expect, it } from "vitest";
import { aspectRatiosDiffer, normaliseFrameToDimensions } from "./importFrames";
import type { Frame } from "$lib/types";

function encodeRgba(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes));
}

function decodeRgba(imageData: string): number[] {
  return Array.from(atob(imageData), (char) => char.charCodeAt(0));
}

function makeRgbaFrame(id: string, width: number, height: number, pixels: number[]): Frame {
  return { id, width, height, duration: 100, imageData: encodeRgba(pixels) };
}

describe("import frame normalisation", () => {
  it("centres a smaller frame in the project dimensions with opaque black padding", () => {
    const redPixel = [255, 0, 0, 255];
    const frame = makeRgbaFrame("small", 1, 1, redPixel);

    const normalised = normaliseFrameToDimensions(frame, { width: 3, height: 3 });

    expect(normalised.width).toBe(3);
    expect(normalised.height).toBe(3);
    expect(normalised.backgroundColour).toBe("#000000");
    expect(normalised.contentBounds).toEqual({ x: 1, y: 1, width: 1, height: 1 });
    expect(decodeRgba(normalised.imageData)).toEqual([
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
      0, 0, 0, 255, 255, 0, 0, 255, 0, 0, 0, 255,
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
    ]);
  });

  it("crops a larger frame around the centre of the source", () => {
    const frame = makeRgbaFrame("large", 3, 1, [
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
    ]);

    const normalised = normaliseFrameToDimensions(frame, { width: 1, height: 1 });

    expect(decodeRgba(normalised.imageData)).toEqual([0, 255, 0, 255]);
  });

  it("detects aspect-ratio differences for the warning flow", () => {
    expect(aspectRatiosDiffer({ width: 20, height: 10 }, { width: 40, height: 20 })).toBe(false);
    expect(aspectRatiosDiffer({ width: 20, height: 10 }, { width: 10, height: 10 })).toBe(true);
  });
});
