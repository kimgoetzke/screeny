import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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

  describe("selectedFrameIds", () => {
    it("is empty when no frames loaded", () => {
      expect(frameStore.selectedFrameIds.size).toBe(0);
    });

    it("contains the first frame id after setFrames", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
    });

    it("is reset to empty by clear()", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });

    it("is reset to empty by startLoading()", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.startLoading();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });
  });

  describe("selectFrame (multi-select reset)", () => {
    it("resets selectedFrameIds to a single-element set", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b"]));
    });
  });

  describe("shiftSelectFrames", () => {
    it("selects range forward from anchor to clicked frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("d");

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c", "d"]));
    });

    it("selects range backward from anchor to clicked frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("a");

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b", "c"]));
    });

    it("collapses to single selection when clicking the current frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("b");

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b"]));
    });

    it("does nothing when no frame is currently selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.shiftSelectFrames("a");

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });

    it("does not change selectedFrameId when extending selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");

      expect(frameStore.selectedFrameId).toBe("a");
    });
  });

  describe("selectNextFrame", () => {
    it("moves selectedFrameId to the next frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.selectNextFrame();

      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("clamps at the last frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("b");
      frameStore.selectNextFrame();

      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("is a no-op when no frames exist", () => {
      frameStore.selectNextFrame();

      expect(frameStore.selectedFrameId).toBeNull();
    });

    it("resets selectedFrameIds to the newly selected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");
      frameStore.selectNextFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b"]));
    });
  });

  describe("selectPreviousFrame", () => {
    it("moves selectedFrameId to the previous frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.selectPreviousFrame();

      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("clamps at the first frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.selectPreviousFrame();

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("is a no-op when no frames exist", () => {
      frameStore.selectPreviousFrame();

      expect(frameStore.selectedFrameId).toBeNull();
    });

    it("resets selectedFrameIds to the newly selected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("a");
      frameStore.selectPreviousFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b"]));
    });
  });

  describe("selectFirstFrame", () => {
    it("selects the first frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.selectFirstFrame();

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("resets selectedFrameIds to the first frame only", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.shiftSelectFrames("c");
      frameStore.selectFirstFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
    });

    it("is a no-op when no frames exist", () => {
      frameStore.selectFirstFrame();

      expect(frameStore.selectedFrameId).toBeNull();
    });
  });

  describe("selectLastFrame", () => {
    it("selects the last frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.selectLastFrame();

      expect(frameStore.selectedFrameId).toBe("c");
    });

    it("resets selectedFrameIds to the last frame only", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.shiftSelectFrames("a");
      frameStore.selectLastFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["c"]));
    });

    it("is a no-op when no frames exist", () => {
      frameStore.selectLastFrame();

      expect(frameStore.selectedFrameId).toBeNull();
    });
  });

  describe("extendSelectionRight", () => {
    it("adds the next frame to selectedFrameIds when single frame selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });

    it("extends the active end right when active end equals the anchor", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c", "d"]));
    });

    it("shrinks the selection when active end moves back towards anchor (right then left then right)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.extendSelectionRight();
      frameStore.extendSelectionLeft();
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c"]));
    });

    it("clamps at the last frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });

    it("is a no-op when no frames exist", () => {
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });

    it("shrinks the selection when Shift+Right is pressed after Shift+Left extended past anchor", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.extendSelectionLeft();
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["c"]));
    });
  });

  describe("extendSelectionLeft", () => {
    it("adds the previous frame to selectedFrameIds when single frame selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c"]));
    });

    it("extends the active end left when active end is left of the anchor", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("b");
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b", "c"]));
    });

    it("shrinks the selection when Shift+Right then Shift+Left is pressed", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.extendSelectionRight();
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b"]));
    });

    it("shrinks the selection when active end moves back towards anchor (left then right then left)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.extendSelectionLeft();
      frameStore.extendSelectionRight();
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c"]));
    });

    it("clamps at the first frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("a");
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });

    it("is a no-op when no frames exist", () => {
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });
  });

  describe("selectionActiveId", () => {
    it("starts at selectedFrameId after selectFrame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");

      expect(frameStore.selectionActiveId).toBe("b");
    });

    it("moves to the active end after extendSelectionRight", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.extendSelectionRight();

      expect(frameStore.selectionActiveId).toBe("b");
    });

    it("moves to the active end after extendSelectionLeft", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.extendSelectionLeft();

      expect(frameStore.selectionActiveId).toBe("b");
    });

    it("resets to selectedFrameId after selectNextFrame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.extendSelectionRight();
      frameStore.selectNextFrame();

      expect(frameStore.selectionActiveId).toBe(frameStore.selectedFrameId);
    });

    it("is null after clear", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();

      expect(frameStore.selectionActiveId).toBeNull();
    });
  });

  describe("selectAllFrames", () => {
    it("selects all frames", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectAllFrames();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b", "c"]));
    });

    it("preserves selectedFrameId (anchor) when already set", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      frameStore.selectAllFrames();

      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("sets selectedFrameId to the first frame when previously null", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectAllFrames();

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("is a no-op when no frames are loaded", () => {
      frameStore.selectAllFrames();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });
  });

  describe("selectToFirstFrame", () => {
    it("selects all frames from the anchor to the first frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.selectToFirstFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b", "c"]));
    });

    it("keeps the anchor frame as selectedFrameId", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.selectToFirstFrame();

      expect(frameStore.selectedFrameId).toBe("c");
    });

    it("sets selectionActiveId to the first frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.selectToFirstFrame();

      expect(frameStore.selectionActiveId).toBe("a");
    });

    it("collapses to a single frame when the anchor is already the first frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.selectToFirstFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
    });

    it("is a no-op when no frames exist", () => {
      frameStore.selectToFirstFrame();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });
  });

  describe("selectToLastFrame", () => {
    it("selects all frames from the anchor to the last frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.selectToLastFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c", "d"]));
    });

    it("keeps the anchor frame as selectedFrameId", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.selectToLastFrame();

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("sets selectionActiveId to the last frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.selectToLastFrame();

      expect(frameStore.selectionActiveId).toBe("c");
    });

    it("collapses to a single frame when the anchor is already the last frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.selectToLastFrame();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["c"]));
    });

    it("is a no-op when no frames exist", () => {
      frameStore.selectToLastFrame();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });
  });
});
