import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import Toolbar from "./Toolbar.svelte";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve(false)),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn(() => Promise.resolve("0.1.0")),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: vi.fn(() => Promise.resolve()),
    toggleMaximize: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(() => Promise.resolve()),
}));

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

describe("Toolbar", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  describe("Open / Close button visibility", () => {
    it("shows Open button when no frames are loaded", () => {
      const { body } = render(Toolbar);
      expect(body).toContain('data-testid="btn-open"');
    });

    it("does not show Close button when no frames are loaded", () => {
      const { body } = render(Toolbar);
      expect(body).not.toContain('data-testid="btn-close"');
    });

    it("shows Close button when frames are loaded", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      const { body } = render(Toolbar);
      expect(body).toContain('data-testid="btn-close"');
    });

    it("does not show Open button when frames are loaded", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      const { body } = render(Toolbar);
      expect(body).not.toContain('data-testid="btn-open"');
    });
  });

  it("play and stop buttons are not shown when there are no frames", () => {
    const { body } = render(Toolbar);
    expect(body).not.toContain('data-testid="btn-play"');
    expect(body).not.toContain('data-testid="btn-stop"');
  });

  it("dedup buttons are never present regardless of frame state", () => {
    // no frames
    const { body: bodyEmpty } = render(Toolbar);
    expect(bodyEmpty).not.toContain('data-testid="btn-dedup-merge"');
    expect(bodyEmpty).not.toContain('data-testid="btn-dedup-drop"');
    // with frames
    frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
    const { body: bodyLoaded } = render(Toolbar);
    expect(bodyLoaded).not.toContain('data-testid="btn-dedup-merge"');
    expect(bodyLoaded).not.toContain('data-testid="btn-dedup-drop"');
  });

  it("play and stop buttons are shown when frames are loaded", () => {
    frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
    const { body } = render(Toolbar);
    expect(body).toContain('data-testid="btn-play"');
    expect(body).toContain('data-testid="btn-stop"');
  });

  it("renders loaded-state playback controls in a dedicated centred toolbar region", () => {
    frameStore.setFrames([makeFrame("a"), makeFrame("b")]);

    const { body } = render(Toolbar);

    expect(body).toMatch(
      /<div class="[^"]*toolbar-playback[^"]*">[\s\S]*data-testid="btn-play"[\s\S]*data-testid="btn-stop"[\s\S]*<\/div>/,
    );
  });

  it("renders the help trigger and custom window controls in the title bar area", () => {
    const { body } = render(Toolbar);

    expect(body).toContain('data-testid="btn-help"');
    expect(body).toContain('data-testid="btn-window-minimise"');
    expect(body).toContain('data-testid="btn-window-maximise"');
    expect(body).toContain('data-testid="btn-window-close"');
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
