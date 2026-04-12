import { describe, it, expect, beforeEach } from "vitest";
import { frameStore } from "./frames.svelte";
import type { Frame } from "$lib/types";

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

describe("frameStore", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  describe("setFrames", () => {
    it("should set frames and select the first one", () => {
      const frames = [makeFrame("a"), makeFrame("b")];
      frameStore.setFrames(frames);

      expect(frameStore.frames).toHaveLength(2);
      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("should clear selection when setting empty array", () => {
      frameStore.setFrames([makeFrame("a")]);
      frameStore.setFrames([]);

      expect(frameStore.frames).toHaveLength(0);
      expect(frameStore.selectedFrameId).toBeNull();
    });
  });

  describe("selectFrame", () => {
    it("should select a frame by id", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("b");

      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("should not change selection for unknown id", () => {
      frameStore.setFrames([makeFrame("a")]);
      frameStore.selectFrame("nonexistent");

      expect(frameStore.selectedFrameId).toBe("a");
    });
  });

  describe("selectedFrame", () => {
    it("should return the selected frame object", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("b");

      expect(frameStore.selectedFrame?.id).toBe("b");
    });

    it("should return undefined when no frames", () => {
      expect(frameStore.selectedFrame).toBeUndefined();
    });
  });

  describe("deleteFrame", () => {
    it("should remove the frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.deleteFrame("b");

      expect(frameStore.frames).toHaveLength(2);
      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c"]);
    });

    it("should select next frame when deleting selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.deleteFrame("b");

      expect(frameStore.selectedFrameId).toBe("c");
    });

    it("should select previous frame when deleting last selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("b");
      frameStore.deleteFrame("b");

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("should clear selection when deleting the only frame", () => {
      frameStore.setFrames([makeFrame("a")]);
      frameStore.deleteFrame("a");

      expect(frameStore.selectedFrameId).toBeNull();
      expect(frameStore.frames).toHaveLength(0);
    });

    it("should not change selection when deleting unselected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.deleteFrame("b");

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("should do nothing for unknown id", () => {
      frameStore.setFrames([makeFrame("a")]);
      frameStore.deleteFrame("nonexistent");

      expect(frameStore.frames).toHaveLength(1);
    });
  });

  describe("reorderFrames", () => {
    it("should move a frame forward", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.reorderFrames(0, 2);

      expect(frameStore.frames.map((f) => f.id)).toEqual(["b", "c", "a"]);
    });

    it("should move a frame backward", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.reorderFrames(2, 0);

      expect(frameStore.frames.map((f) => f.id)).toEqual(["c", "a", "b"]);
    });

    it("should do nothing when indices are equal", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.reorderFrames(0, 0);

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b"]);
    });

    it("should do nothing for out-of-bounds indices", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.reorderFrames(-1, 0);

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b"]);
    });
  });

  describe("hasFrames", () => {
    it("should return false when empty", () => {
      expect(frameStore.hasFrames).toBe(false);
    });

    it("should return true when frames exist", () => {
      frameStore.setFrames([makeFrame("a")]);
      expect(frameStore.hasFrames).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all frames and clear selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();

      expect(frameStore.frames).toHaveLength(0);
      expect(frameStore.selectedFrameId).toBeNull();
    });
  });
});
