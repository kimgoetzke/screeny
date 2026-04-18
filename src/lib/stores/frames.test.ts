import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  describe("playback", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("isPlaying is false initially", () => {
      expect(frameStore.isPlaying).toBe(false);
    });

    it("play() sets isPlaying to true", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      expect(frameStore.isPlaying).toBe(true);
    });

    it("play() is a no-op when there are no frames", () => {
      frameStore.play();
      expect(frameStore.isPlaying).toBe(false);
    });

    it("advances selectedFrameId after the current frame's duration elapses", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200)]);
      frameStore.play();
      expect(frameStore.selectedFrameId).toBe("a");
      vi.advanceTimersByTime(100);
      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("wraps back to frame 0 after the last frame", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200)]);
      frameStore.play();
      vi.advanceTimersByTime(100); // a → b
      vi.advanceTimersByTime(200); // b → a (wrap)
      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("stop() sets isPlaying to false", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      frameStore.stop();
      expect(frameStore.isPlaying).toBe(false);
    });

    it("stop() preserves selectedFrameId at the current frame", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200), makeFrame("c", 300)]);
      frameStore.play();
      vi.advanceTimersByTime(100); // a → b
      frameStore.stop();
      expect(frameStore.selectedFrameId).toBe("b");
    });

    it("setFrames() stops in-progress playback", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      frameStore.setFrames([makeFrame("x"), makeFrame("y")]);
      expect(frameStore.isPlaying).toBe(false);
    });

    it("clear() stops in-progress playback", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      frameStore.clear();
      expect(frameStore.isPlaying).toBe(false);
    });

    it("play() is a no-op when already playing", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 100)]);
      frameStore.play();
      frameStore.play();
      // isPlaying should still be true, and only one timer chain running
      expect(frameStore.isPlaying).toBe(true);
      vi.advanceTimersByTime(100);
      // frame should advance exactly once, not twice
      expect(frameStore.selectedFrameId).toBe("b");
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

  describe("addFrame", () => {
    it("appends a frame to the frames list", () => {
      frameStore.addFrame(makeFrame("a"));

      expect(frameStore.frames).toHaveLength(1);
      expect(frameStore.frames[0].id).toBe("a");
    });

    it("selects the first frame added", () => {
      frameStore.addFrame(makeFrame("a"));

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("does not change selection when adding a subsequent frame", () => {
      frameStore.addFrame(makeFrame("a"));
      frameStore.addFrame(makeFrame("b"));

      expect(frameStore.selectedFrameId).toBe("a");
      expect(frameStore.frames).toHaveLength(2);
    });
  });

  describe("isLoading", () => {
    it("is false initially", () => {
      expect(frameStore.isLoading).toBe(false);
    });

    it("startLoading sets isLoading to true", () => {
      frameStore.startLoading();

      expect(frameStore.isLoading).toBe(true);
    });

    it("finishLoading sets isLoading to false", () => {
      frameStore.startLoading();
      frameStore.finishLoading();

      expect(frameStore.isLoading).toBe(false);
    });

    it("startLoading clears existing frames", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.startLoading();

      expect(frameStore.frames).toHaveLength(0);
    });
  });

  describe("loadingProgress", () => {
    it("is null when not loading", () => {
      expect(frameStore.loadingProgress).toBeNull();
    });

    it("startLoading resets progress to 0", () => {
      frameStore.startLoading();

      expect(frameStore.loadingProgress).toBe(0);
    });

    it("setLoadingProgress updates loadingProgress", () => {
      frameStore.startLoading();
      frameStore.setLoadingProgress(50);

      expect(frameStore.loadingProgress).toBe(50);
    });

    it("finishLoading clears progress to null", () => {
      frameStore.startLoading();
      frameStore.setLoadingProgress(50);
      frameStore.finishLoading();

      expect(frameStore.loadingProgress).toBeNull();
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

  describe("deleteSelectedFrames", () => {
    it("deletes all selected frames", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.deleteSelectedFrames();

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "d"]);
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

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c"]);
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
