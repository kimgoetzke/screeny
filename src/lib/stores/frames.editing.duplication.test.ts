import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, makeFrameWithData, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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
});
