import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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

    it("preserves the frames array reference across appends (mutation-friendly)", () => {
      frameStore.addFrame(makeFrame("a"));
      const before = frameStore.frames;
      frameStore.addFrame(makeFrame("b"));

      expect(frameStore.frames).toBe(before);
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b"]);
    });
  });

  describe("addFrames (batched)", () => {
    it("appends multiple frames to the frames list in order", () => {
      frameStore.addFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);

      expect(frameStore.frames).toHaveLength(3);
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
    });

    it("selects the first frame when batching into an empty store", () => {
      frameStore.addFrames([makeFrame("a"), makeFrame("b")]);

      expect(frameStore.selectedFrameId).toBe("a");
      expect(frameStore.selectedFrameIds).toEqual(new Set(["a"]));
    });

    it("keeps the existing selection when batching onto a non-empty store", () => {
      frameStore.addFrame(makeFrame("a"));
      frameStore.addFrames([makeFrame("b"), makeFrame("c")]);

      expect(frameStore.selectedFrameId).toBe("a");
      expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b", "c"]);
    });

    it("is a no-op for an empty input", () => {
      frameStore.addFrames([]);

      expect(frameStore.frames).toHaveLength(0);
      expect(frameStore.selectedFrameId).toBeNull();
    });

    it("preserves the frames array reference across batched appends (mutation-friendly)", () => {
      frameStore.addFrames([makeFrame("a")]);
      const before = frameStore.frames;
      frameStore.addFrames([makeFrame("b"), makeFrame("c")]);

      expect(frameStore.frames).toBe(before);
    });
  });
});
