import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { frameStore } from "./frames.svelte";
import { makeFrame, resetFrameStoreBeforeEach } from "./frameStore.test-support";

describe("frameStore", () => {
  resetFrameStoreBeforeEach();

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
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(100);
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
      expect(frameStore.isPlaying).toBe(true);
      vi.advanceTimersByTime(100);
      expect(frameStore.selectedFrameId).toBe("b");
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
});
