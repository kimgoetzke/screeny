import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import Toolbar from "./Toolbar.svelte";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve(false)),
}));

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

describe("Toolbar", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  it("play and stop buttons are not shown when there are no frames", () => {
    const { body } = render(Toolbar);
    expect(body).not.toContain('data-testid="btn-play"');
    expect(body).not.toContain('data-testid="btn-stop"');
  });

  it("play and stop buttons are shown when frames are loaded", () => {
    frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
    const { body } = render(Toolbar);
    expect(body).toContain('data-testid="btn-play"');
    expect(body).toContain('data-testid="btn-stop"');
  });

  describe("disabled states", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("play button is not disabled when not playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      const { body } = render(Toolbar);
      const playBtnTag = body.match(/<button[^>]*data-testid="btn-play"[^>]*>/)?.[0] ?? "";
      expect(playBtnTag).not.toContain("disabled");
    });

    it("stop button is disabled when not playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      const { body } = render(Toolbar);
      const stopBtnTag = body.match(/<button[^>]*data-testid="btn-stop"[^>]*>/)?.[0] ?? "";
      expect(stopBtnTag).toContain("disabled");
    });

    it("play button is disabled when playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      const { body } = render(Toolbar);
      const playBtnTag = body.match(/<button[^>]*data-testid="btn-play"[^>]*>/)?.[0] ?? "";
      expect(playBtnTag).toContain("disabled");
    });

    it("stop button is not disabled when playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      const { body } = render(Toolbar);
      const stopBtnTag = body.match(/<button[^>]*data-testid="btn-stop"[^>]*>/)?.[0] ?? "";
      expect(stopBtnTag).not.toContain("disabled");
    });
  });
});
