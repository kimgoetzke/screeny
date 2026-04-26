import { describe, expect, it } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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

  describe("loading frame totals", () => {
    it("stores the total frame count from the start event", () => {
      frameStore.startLoading();
      frameStore.setLoadingTotalFrames(4);

      expect(frameStore.loadingTotalFrames).toBe(4);
      expect(frameStore.loadingFrameCount).toBe(0);
    });

    it("tracks how many frames have been added while loading", () => {
      frameStore.startLoading();
      frameStore.setLoadingTotalFrames(2);
      frameStore.addFrame(makeFrame("a"));

      expect(frameStore.loadingFrameCount).toBe(1);
    });

    it("tracks batched frames while loading", () => {
      frameStore.startLoading();
      frameStore.setLoadingTotalFrames(5);
      frameStore.addFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);

      expect(frameStore.loadingFrameCount).toBe(3);
    });

    it("clears frame totals when loading finishes", () => {
      frameStore.startLoading();
      frameStore.setLoadingTotalFrames(2);
      frameStore.addFrame(makeFrame("a"));
      frameStore.finishLoading();

      expect(frameStore.loadingTotalFrames).toBeNull();
      expect(frameStore.loadingFrameCount).toBe(0);
    });
  });

  describe("cancelLoad", () => {
    it("resets store to empty-app state", () => {
      frameStore.startLoading();
      frameStore.addFrame(makeFrame("a"));

      frameStore.cancelLoad();

      expect(frameStore.hasFrames).toBe(false);
      expect(frameStore.isLoading).toBe(false);
      expect(frameStore.selectedFrameId).toBeNull();
      expect(frameStore.loadingProgress).toBeNull();
      expect(frameStore.loadingFrameCount).toBe(0);
      expect(frameStore.loadingTotalFrames).toBeNull();
    });
  });

  describe("loadSessionId", () => {
    it("startLoading increments loadSessionId", () => {
      const before = frameStore.loadSessionId;
      frameStore.startLoading();

      expect(frameStore.loadSessionId).toBeGreaterThan(before);
    });

    it("cancelLoad increments loadSessionId", () => {
      frameStore.startLoading();
      const duringLoad = frameStore.loadSessionId;

      frameStore.cancelLoad();

      expect(frameStore.loadSessionId).toBeGreaterThan(duringLoad);
    });

    it("each startLoading produces a unique session ID", () => {
      const first = frameStore.loadSessionId;
      frameStore.startLoading();
      const second = frameStore.loadSessionId;
      frameStore.finishLoading();
      frameStore.startLoading();
      const third = frameStore.loadSessionId;

      expect(second).not.toBe(first);
      expect(third).not.toBe(second);
    });
  });
});
