import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

  describe("deleteFrame", () => {
    it("should remove the frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.deleteFrame("b");

      expect(frameStore.frames).toHaveLength(2);
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c"]);
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

  describe("deleteSelectedFrames", () => {
    it("deletes all selected frames", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.deleteSelectedFrames();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "d"]);
    });

    it("selects the frame immediately after the deleted range", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.deleteSelectedFrames();

      expect(frameStore.selectedFrameId).toBe("d");
    });

    it("selects the last remaining frame when deleted range was at the end", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.deleteSelectedFrames();

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("clears selection when all frames are deleted", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.deleteSelectedFrames();

      expect(frameStore.selectedFrameId).toBeNull();
      expect(frameStore.selectedFrameIds.size).toBe(0);
    });

    it("resets selectedFrameIds to the single newly selected frame after deletion", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.deleteSelectedFrames();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["c"]));
    });

    it("works for a single selected frame (equivalent to deleteFrame)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.deleteSelectedFrames();

      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c"]);
      expect(frameStore.selectedFrameId).toBe("c");
    });
  });

  describe("deleteFrame (selectedFrameIds sync)", () => {
    it("removes a deleted frame from selectedFrameIds when it was part of the selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.deleteFrame("c");

      expect(frameStore.selectedFrameIds.has("c")).toBe(false);
    });
  });
});
