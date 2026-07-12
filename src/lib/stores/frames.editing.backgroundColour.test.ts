import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

  describe("setFrameBackgroundColour", () => {
    it("sets background colour on all frames in a multi-selection and keeps the selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");

      frameStore.setFrameBackgroundColour("#336699");

      expect(frameStore.frames[0].backgroundColour).toBe("#336699");
      expect(frameStore.frames[1].backgroundColour).toBe("#336699");
      expect(frameStore.frames[2].backgroundColour).toBeUndefined();
      expect(frameStore.selectedFrameIds).toEqual(new Set(["a", "b"]));
    });
  });
});
