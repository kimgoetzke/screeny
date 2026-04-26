import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

  describe("reorderFrames", () => {
    it("should move a frame forward", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.reorderFrames(0, 2);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["b", "c", "a"]);
    });

    it("should move a frame backward", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.reorderFrames(2, 0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["c", "a", "b"]);
    });

    it("should do nothing when indices are equal", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.reorderFrames(0, 0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b"]);
    });

    it("should do nothing for out-of-bounds indices", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.reorderFrames(-1, 0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b"]);
    });
  });

  describe("moveSelectedFrames", () => {
    it("moves a group of frames forward (tracer bullet)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrames(3);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["d", "a", "b", "c"]);
    });

    it("moves a group of frames backward", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("d");
      frameStore.moveSelectedFrames(0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c", "d", "b"]);
    });

    it("moves a single selected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.moveSelectedFrames(0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c", "b"]);
    });

    it("is a no-op when dropping on a selected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrames(1);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c", "d"]);
    });

    it("is a no-op for an out-of-bounds target index", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.moveSelectedFrames(99);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b"]);
    });

    it("is a no-op when there is no selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.moveSelectedFrames(0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual([]);
    });

    it("preserves selectedFrameIds after moving", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.moveSelectedFrames(3);

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });

    it("moves a non-contiguous middle group forward", () => {
      frameStore.setFrames([
        makeFrame("a"),
        makeFrame("b"),
        makeFrame("c"),
        makeFrame("d"),
        makeFrame("e"),
      ]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrames(4);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "d", "e", "b", "c"]);
    });
  });

  describe("moveFramesToInsertionPoint", () => {
    it("moves a group forward to after the last frame (tracer bullet)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");
      frameStore.moveFramesToInsertionPoint(4);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["d", "a", "b", "c"]);
    });

    it("moves a group backward to the very beginning", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("d");
      frameStore.moveFramesToInsertionPoint(0);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["c", "d", "a", "b"]);
    });

    it("moves a middle group to after the last frame", () => {
      frameStore.setFrames([
        makeFrame("a"),
        makeFrame("b"),
        makeFrame("c"),
        makeFrame("d"),
        makeFrame("e"),
      ]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveFramesToInsertionPoint(5);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "d", "e", "b", "c"]);
    });

    it("is a no-op when the insertion slot is within the selected range", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveFramesToInsertionPoint(2);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c", "d"]);
    });

    it("is a no-op when there is no selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.moveFramesToInsertionPoint(1);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual([]);
    });

    it("clamps an out-of-bounds insertion index to the end", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.moveFramesToInsertionPoint(99);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["b", "c", "a"]);
    });

    it("preserves selectedFrameIds after the move", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.moveFramesToInsertionPoint(4);

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });

    it("moves a single selected frame using the insertion slot", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.moveFramesToInsertionPoint(1);

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c", "b"]);
    });
  });

  describe("moveSelectedFramesToStart", () => {
    it("moves the selected range to index 0", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("d");
      frameStore.moveSelectedFramesToStart();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["c", "d", "a", "b"]);
    });
  });

  describe("moveSelectedFrameLeft", () => {
    it("moves the selected range one position left", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("d");
      frameStore.moveSelectedFrameLeft();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c", "d", "b"]);
    });

    it("is a no-op when the selection already starts at index 0", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.moveSelectedFrameLeft();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
    });
  });

  describe("moveSelectedFrameRight", () => {
    it("moves the selected range one position right", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrameRight();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "d", "b", "c"]);
    });

    it("is a no-op when the selection already ends at the last index", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrameRight();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
    });
  });

  describe("moveSelectedFramesToEnd", () => {
    it("moves the selected range to the end", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.moveSelectedFramesToEnd();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["c", "d", "a", "b"]);
    });
  });
});
