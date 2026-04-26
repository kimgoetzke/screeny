import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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
});
