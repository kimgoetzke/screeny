import { describe, expect, it } from "vitest";
import { setFrameBackgroundColour } from "./frameEditing";
import type { Frame } from "$lib/types";

function encodeRgba(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes));
}

function decodeRgba(imageData: string): number[] {
  return Array.from(atob(imageData), (char) => char.charCodeAt(0));
}

function makeFrame(imageData: string): Frame {
  return {
    id: "padded",
    width: 3,
    height: 3,
    duration: 100,
    imageData,
    backgroundColour: "#000000",
    contentBounds: { x: 1, y: 1, width: 1, height: 1 },
  };
}

describe("setFrameBackgroundColour", () => {
  it("recolours only padding pixels on a selected padded frame", () => {
    const black = [0, 0, 0, 255];
    const red = [255, 0, 0, 255];
    const frame = makeFrame(
      encodeRgba([...black, ...black, ...black, ...black, ...red, ...black, ...black, ...black, ...black]),
    );

    const result = setFrameBackgroundColour(
      [frame],
      { selectedFrameId: "padded", selectedFrameIds: new Set(["padded"]), selectionActiveId: "padded" },
      "#00ff00",
    );

    expect(result.frames[0].backgroundColour).toBe("#00ff00");
    expect(decodeRgba(result.frames[0].imageData)).toEqual([
      0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
      0, 255, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255,
      0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
    ]);
  });

  it("stores the colour without changing pixels when the selected frame fills the canvas", () => {
    const imageData = encodeRgba([255, 0, 0, 255]);
    const frame: Frame = {
      id: "full",
      width: 1,
      height: 1,
      duration: 100,
      imageData,
      contentBounds: { x: 0, y: 0, width: 1, height: 1 },
    };

    const result = setFrameBackgroundColour(
      [frame],
      { selectedFrameId: "full", selectedFrameIds: new Set(["full"]), selectionActiveId: "full" },
      "#123456",
    );

    expect(result.frames[0].backgroundColour).toBe("#123456");
    expect(result.frames[0].imageData).toBe(imageData);
  });
});
