import { beforeEach, describe, expect, it } from "vitest";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";
import { createImportTransaction } from "./importTransaction";

function makeRgbaFrame(id: string, width: number, height: number, pixels: number[]): Frame {
  return { id, imageData: btoa(String.fromCharCode(...pixels)), duration: 100, width, height };
}

describe("import transaction", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  it("buffers frames until commit and inserts after the captured frame", () => {
    const existingFrames = [
      makeRgbaFrame("a", 1, 1, [0, 0, 0, 255]),
      makeRgbaFrame("b", 1, 1, [0, 0, 0, 255]),
    ];
    frameStore.setFrames(existingFrames);
    frameStore.selectFrame("a");
    const transaction = createImportTransaction(frameStore.selectedFrame!);

    transaction.addFrame(makeRgbaFrame("imported", 1, 1, [255, 0, 0, 255]));

    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b"]);

    const result = transaction.commit();

    expect(result).toEqual({ importedFrameCount: 1, hasAspectRatioMismatch: false });
    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "imported", "b"]);
  });

  it("preserves the current selection when the user changes it before commit", () => {
    const existingFrames = [
      makeRgbaFrame("a", 1, 1, [0, 0, 0, 255]),
      makeRgbaFrame("b", 1, 1, [0, 0, 0, 255]),
      makeRgbaFrame("c", 1, 1, [0, 0, 0, 255]),
    ];
    frameStore.setFrames(existingFrames);
    frameStore.selectFrame("b");
    const transaction = createImportTransaction(frameStore.selectedFrame!);
    transaction.addFrame(makeRgbaFrame("imported", 1, 1, [255, 0, 0, 255]));

    frameStore.selectFrame("c");
    transaction.commit();

    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "imported", "c"]);
    expect(frameStore.selectedFrameId).toBe("c");
  });

  it("normalises dimensions and reports aspect-ratio mismatch", () => {
    const target = makeRgbaFrame("target", 2, 2, new Array(16).fill(0));
    frameStore.setFrames([target]);
    const transaction = createImportTransaction(frameStore.selectedFrame!);

    transaction.addFrame(makeRgbaFrame("wide", 2, 1, [
      255, 0, 0, 255,
      0, 255, 0, 255,
    ]));
    const result = transaction.commit();

    expect(result).toEqual({ importedFrameCount: 1, hasAspectRatioMismatch: true });
    expect(frameStore.frames[1]).toMatchObject({ id: "wide", width: 2, height: 2 });
  });
});
