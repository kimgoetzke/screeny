import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, makeFrameWithData, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
    });

    it("does not remove non-adjacent identical frames", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "different", 100),
        makeFrameWithData("c", "same", 100),
      ]);
      frameStore.deduplicateAdjacentMerge();
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
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
        expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c", "d"]);
        expect(frameStore.frames[0].duration).toBe(300);
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
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentMerge();

        expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c", "d"]);
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

        expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
      });

      it("updates selectedFrameId to the first surviving selected frame when anchor is removed", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
        ]);
        frameStore.selectFrame("b");
        frameStore.shiftSelectFrames("a");
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
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
    });

    it("does not remove non-adjacent identical frames", () => {
      frameStore.setFrames([
        makeFrameWithData("a", "same", 100),
        makeFrameWithData("b", "different", 100),
        makeFrameWithData("c", "same", 100),
      ]);
      frameStore.deduplicateAdjacentDrop();
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
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
        expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "c", "d"]);
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
        frameStore.selectFrame("a");
        frameStore.shiftSelectFrames("b");
        frameStore.deduplicateAdjacentDrop();

        expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c", "d"]);
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

        expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
      });

      it("updates selectedFrameId to the first surviving selected frame when anchor is removed", () => {
        frameStore.setFrames([
          makeFrameWithData("a", "red", 100),
          makeFrameWithData("b", "red", 200),
          makeFrameWithData("c", "blue", 100),
        ]);
        frameStore.selectFrame("b");
        frameStore.shiftSelectFrames("a");
        frameStore.deduplicateAdjacentDrop();

        expect(frameStore.selectedFrameId).toBe("a");
      });
    });
  });
});
