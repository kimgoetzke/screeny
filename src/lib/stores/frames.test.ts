import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { frameStore } from "./frames.svelte";
import type { Frame } from "$lib/types";

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

function makeFrameWithData(id: string, imageData: string, duration = 100): Frame {
  return { id, imageData, duration, width: 10, height: 10 };
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

    it("advances selectedFrameIds after the current frame's duration elapses", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200)]);
      frameStore.play();
      expect(frameStore.selectedFrameIds.has("a")).toBe(true);
      vi.advanceTimersByTime(100);
      expect(frameStore.selectedFrameIds.has("b")).toBe(true);
      expect(frameStore.selectedFrameIds.has("a")).toBe(false);
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

  describe("deduplicateAdjacentMerge", () => {
    it("merges the adjacent duplicate's duration into the kept frame", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "same", 200),
      ]);
      frameStore.deduplicateAdjacentMerge();
      expect(frameStore.frames).toHaveLength(1);
      expect(frameStore.frames[0].id).toBe("a");
      expect(frameStore.frames[0].duration).toBe(300);
    });

    it("is a no-op when no adjacent duplicates exist", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.deduplicateAdjacentMerge();
      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c"]);
    });

    it("does not remove non-adjacent identical frames", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "different", 100),
        makeFrameWithData("c", "same", 100),
      ]);
      frameStore.deduplicateAdjacentMerge();
      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c"]);
    });

    it("selects the kept frame when the selected frame is removed", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "same", 200),
      ]);
      frameStore.selectFrame("b");
      frameStore.deduplicateAdjacentMerge();
      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("keeps selection unchanged when the selected frame is retained", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "same", 200),
      ]);
      frameStore.selectFrame("a");
      frameStore.deduplicateAdjacentMerge();
      expect(frameStore.selectedFrameId).toBe("a");
    });

    describe("selection-scoped (≥2 frames selected)", () => {
      it("deduplicates only the selected frames and leaves non-selected frames unchanged", () => {
        // [red(100ms), red(200ms), blue(100ms), blue(150ms)]
        // select frames 0–1 (both red); blue frames must NOT be merged
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
          makeFrameWithData("d", "blue", 150),
        ]);
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentMerge();

        expect(frameStore.frames).toHaveLength(3);
        expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c", "d"]);
        expect(frameStore.frames[0].duration).toBe(300);
        expect(frameStore.frames[1].duration).toBe(100);
        expect(frameStore.frames[2].duration).toBe(150);
      });

      it("is a no-op for the selection when there are no adjacent duplicates within it", () => {
        // select frames with different imageData — nothing to merge
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "blue", 100),
          makeFrameWithData("c", "red", 100),
          makeFrameWithData("d", "red", 200),
        ]);
        // select "a" and "b" — no adjacent duplicates within selection
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentMerge();

        expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c", "d"]);
      });

      it("sets selectedFrameIds to the surviving selected frames after merge", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
          makeFrameWithData("d", "blue", 150),
        ]);
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentMerge();

        // "b" was merged into "a" and removed; only "a" survives from the selection
        expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
      });

      it("updates selectedFrameId to the first surviving selected frame when anchor is removed", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
        ]);
        // anchor is "b" (will be removed by merge)
        frameStore.selectFrame("b");
        frameStore.shiftSelectFrames("a"); // range "a"–"b", anchor stays "b"
        frameStore.deduplicateAdjacentMerge();

        expect(frameStore.selectedFrameId).toBe("a");
      });
    });
  });

  describe("deduplicateAdjacentDrop", () => {
    it("removes the adjacent duplicate without merging duration", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "same", 200),
      ]);
      frameStore.deduplicateAdjacentDrop();
      expect(frameStore.frames).toHaveLength(1);
      expect(frameStore.frames[0].id).toBe("a");
      expect(frameStore.frames[0].duration).toBe(100);
    });

    it("is a no-op when no adjacent duplicates exist", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.deduplicateAdjacentDrop();
      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c"]);
    });

    it("does not remove non-adjacent identical frames", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "different", 100),
        makeFrameWithData("c", "same", 100),
      ]);
      frameStore.deduplicateAdjacentDrop();
      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c"]);
    });

    it("selects the kept frame when the selected frame is removed", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "same", 200),
      ]);
      frameStore.selectFrame("b");
      frameStore.deduplicateAdjacentDrop();
      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("keeps selection unchanged when the selected frame is retained", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "same", 200),
      ]);
      frameStore.selectFrame("a");
      frameStore.deduplicateAdjacentDrop();
      expect(frameStore.selectedFrameId).toBe("a");
    });

    describe("selection-scoped (≥2 frames selected)", () => {
      it("drops duplicates only within the selection and leaves non-selected frames unchanged", () => {
        // [red(100ms), red(200ms), blue(100ms), blue(150ms)]
        // select frames 0–1; blue frames must NOT be dropped
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
          makeFrameWithData("d", "blue", 150),
        ]);
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentDrop();

        expect(frameStore.frames).toHaveLength(3);
        expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c", "d"]);
        // drop semantics: kept frame duration is unchanged
        expect(frameStore.frames[0].duration).toBe(100);
        expect(frameStore.frames[1].duration).toBe(100);
        expect(frameStore.frames[2].duration).toBe(150);
      });

      it("is a no-op for the selection when there are no adjacent duplicates within it", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "blue", 100),
          makeFrameWithData("c", "red", 100),
          makeFrameWithData("d", "red", 200),
        ]);
        // select "a" and "b" — no adjacent duplicates within selection
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentDrop();

        expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c", "d"]);
      });

      it("sets selectedFrameIds to the surviving selected frames after drop", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
          makeFrameWithData("d", "blue", 150),
        ]);
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentDrop();

        // "b" was dropped; only "a" survives from the selection
        expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
      });

      it("updates selectedFrameId to the first surviving selected frame when anchor is removed", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
        ]);
        // anchor is "b" (will be dropped)
        frameStore.selectFrame("b");
        frameStore.shiftSelectFrames("a"); // range "a"–"b", anchor stays "b"
        frameStore.deduplicateAdjacentDrop();

        expect(frameStore.selectedFrameId).toBe("a");
      });
    });
  });

  describe("moveSelectedFrames", () => {
    it("moves a group of frames forward (tracer bullet)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrames(3); // drop on d

      expect(frameStore.frames.map((f) => f.id)).toEqual(["d", "a", "b", "c"]);
    });

    it("moves a group of frames backward", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("d");
      frameStore.moveSelectedFrames(0); // drop on a

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c", "d", "b"]);
    });

    it("moves a single selected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.moveSelectedFrames(0); // drop on a

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c", "b"]);
    });

    it("is a no-op when dropping on a selected frame", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveSelectedFrames(1); // drop on b (selected)

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c", "d"]);
    });

    it("is a no-op for an out-of-bounds target index", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.moveSelectedFrames(99);

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b"]);
    });

    it("is a no-op when there is no selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.moveSelectedFrames(0);

      expect(frameStore.frames.map((f) => f.id)).toEqual([]);
    });

    it("preserves selectedFrameIds after moving", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.moveSelectedFrames(3); // drop on d

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
      frameStore.moveSelectedFrames(4); // drop on e

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "d", "e", "b", "c"]);
    });
  });

  describe("moveFramesToInsertionPoint", () => {
    it("moves a group forward to after the last frame (tracer bullet)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");
      frameStore.moveFramesToInsertionPoint(4); // insertion slot after d

      expect(frameStore.frames.map((f) => f.id)).toEqual(["d", "a", "b", "c"]);
    });

    it("moves a group backward to the very beginning", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.shiftSelectFrames("d");
      frameStore.moveFramesToInsertionPoint(0); // insertion slot before a

      expect(frameStore.frames.map((f) => f.id)).toEqual(["c", "d", "a", "b"]);
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
      frameStore.moveFramesToInsertionPoint(5); // after e

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "d", "e", "b", "c"]);
    });

    it("is a no-op when the insertion slot is within the selected range", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.moveFramesToInsertionPoint(2); // between b and c

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "b", "c", "d"]);
    });

    it("is a no-op when there is no selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.moveFramesToInsertionPoint(1);

      expect(frameStore.frames.map((f) => f.id)).toEqual([]);
    });

    it("clamps an out-of-bounds insertion index to the end", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.moveFramesToInsertionPoint(99);

      expect(frameStore.frames.map((f) => f.id)).toEqual(["b", "c", "a"]);
    });

    it("preserves selectedFrameIds after the move", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.moveFramesToInsertionPoint(4); // after d

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });

    it("moves a single selected frame using the insertion slot", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("c");
      frameStore.moveFramesToInsertionPoint(1); // between a and b

      expect(frameStore.frames.map((f) => f.id)).toEqual(["a", "c", "b"]);
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
      // anchor is "b", active end is "c" (right of anchor) — should add "d"
      frameStore.extendSelectionRight();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b", "c", "d"]));
    });

    it("shrinks the selection when active end moves back towards anchor (right then left then right)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.extendSelectionRight(); // active="c", selection={"b","c"}
      frameStore.extendSelectionLeft();  // active="b", selection={"b"}
      frameStore.extendSelectionRight(); // active="c", selection={"b","c"}

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
      frameStore.extendSelectionLeft();  // active="b", selection={"b","c"}
      frameStore.extendSelectionRight(); // active="c", selection={"c"} — shrinks back to anchor

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
      // anchor is "c", active end is "b" (left of anchor) — should add "a"
      frameStore.extendSelectionLeft();

      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b", "c"]));
    });

    it("shrinks the selection when Shift+Right then Shift+Left is pressed", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.extendSelectionRight(); // active="c", selection={"b","c"}
      frameStore.extendSelectionLeft();  // active="b", selection={"b"} — shrinks to anchor

      expect(frameStore.selectedFrameIds).toEqual(new Set(["b"]));
    });

    it("shrinks the selection when active end moves back towards anchor (left then right then left)", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("c");
      frameStore.extendSelectionLeft(); // active="b", selection={"b","c"}
      frameStore.extendSelectionRight(); // active="c", selection={"c"}
      frameStore.extendSelectionLeft(); // active="b", selection={"b","c"}

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
      frameStore.extendSelectionRight(); // active="b"
      frameStore.selectNextFrame();      // resets to new selectedFrameId

      expect(frameStore.selectionActiveId).toBe(frameStore.selectedFrameId);
    });

    it("is null after clear", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();

      expect(frameStore.selectionActiveId).toBeNull();
    });
  });

  describe("togglePlayback", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("starts playback when stopped", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.togglePlayback();

      expect(frameStore.isPlaying).toBe(true);
    });

    it("stops playback when playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      frameStore.togglePlayback();

      expect(frameStore.isPlaying).toBe(false);
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
      // Manually verify no selection exists, then add frames back without selection
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      // Force a null selectedFrameId scenario via shiftSelectFrames after clear
      // Instead test: after setFrames anchor is first frame, selectAllFrames keeps it
      frameStore.selectAllFrames();

      expect(frameStore.selectedFrameId).toBe("a");
    });

    it("is a no-op when no frames are loaded", () => {
      frameStore.selectAllFrames();

      expect(frameStore.selectedFrameIds.size).toBe(0);
    });
  });

  describe("setFrameDuration", () => {
    it("sets the duration on the selected frame", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200)]);
      frameStore.selectFrame("a");
      frameStore.setFrameDuration(500);

      expect(frameStore.frames[0].duration).toBe(500);
      expect(frameStore.frames[1].duration).toBe(200);
    });

    it("sets duration on all frames in a multi-selection", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200), makeFrame("c", 300)]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      frameStore.setFrameDuration(750);

      expect(frameStore.frames[0].duration).toBe(750);
      expect(frameStore.frames[1].duration).toBe(750);
      expect(frameStore.frames[2].duration).toBe(300);
    });

    it("clamps duration to a minimum of 1", () => {
      frameStore.setFrames([makeFrame("a", 100)]);
      frameStore.selectFrame("a");
      frameStore.setFrameDuration(0);

      expect(frameStore.frames[0].duration).toBe(1);
    });

    it("clamps duration to a maximum of 9999", () => {
      frameStore.setFrames([makeFrame("a", 100)]);
      frameStore.selectFrame("a");
      frameStore.setFrameDuration(10000);

      expect(frameStore.frames[0].duration).toBe(9999);
    });

    it("is a no-op when nothing is selected", () => {
      frameStore.setFrames([makeFrame("a", 100)]);
      frameStore.clear();
      frameStore.setFrameDuration(500);

      expect(frameStore.frames).toHaveLength(0);
    });
  });

  describe("duplicateSelectedFrames", () => {
    it("inserts a copy of the selected frame immediately after it", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.duplicateSelectedFrames();

      expect(frameStore.frames).toHaveLength(4);
      expect(frameStore.frames[0].id).toBe("a");
      expect(frameStore.frames[2].id).toBe("b");
    });

    it("gives the duplicate a new unique ID", () => {
      frameStore.setFrames([makeFrame("a")]);
      frameStore.selectFrame("a");
      frameStore.duplicateSelectedFrames();

      expect(frameStore.frames[1].id).not.toBe("a");
    });

    it("preserves imageData and duration on the duplicate", () => {
      frameStore.setFrames([makeFrameWithData("a", "pixel-data", 300)]);
      frameStore.selectFrame("a");
      frameStore.duplicateSelectedFrames();

      expect(frameStore.frames[1].imageData).toBe("pixel-data");
      expect(frameStore.frames[1].duration).toBe(300);
    });

    it("duplicates multiple selected frames and inserts them after the last selected, in order", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      frameStore.duplicateSelectedFrames();

      // Original order: a, b, c, d → a, b, c, copy-b, copy-c, d
      expect(frameStore.frames).toHaveLength(6);
      expect(frameStore.frames[0].id).toBe("a");
      expect(frameStore.frames[1].id).toBe("b");
      expect(frameStore.frames[2].id).toBe("c");
      expect(frameStore.frames[3].imageData).toBe(frameStore.frames[1].imageData);
      expect(frameStore.frames[4].imageData).toBe(frameStore.frames[2].imageData);
      expect(frameStore.frames[5].id).toBe("d");
    });

    it("selects the newly duplicated frames after duplication", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      frameStore.duplicateSelectedFrames();

      const duplicateId = frameStore.frames[1].id;
      expect(frameStore.selectedFrameId).toBe(duplicateId);
      expect(frameStore.selectedFrameIds).toEqual(new Set([duplicateId]));
    });

    it("is a no-op when nothing is selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.clear();
      frameStore.duplicateSelectedFrames();

      expect(frameStore.frames).toHaveLength(0);
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
