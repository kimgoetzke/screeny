import { beforeEach, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import FrameViewer from "./FrameViewer.svelte";
import frameViewerSource from "./FrameViewer.svelte?raw";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

function makeFrame(id: string): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration: 100, width: 10, height: 10 };
}

describe("FrameViewer", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  it("hides the empty-state copy while a file is being dragged over the viewer", () => {
    const { body } = render(FrameViewer, {
      props: {
        showEmptyState: false,
      },
    });

    expect(body).not.toContain("Open or drop a GIF to get started");
  });

  it("shows a background grid even when no GIF is loaded", () => {
    const { body } = render(FrameViewer);

    expect(body).toContain('data-testid="viewer-grid-fade"');
    expect(body).toContain('data-testid="viewer-grid-stage"');
    expect(body).toContain('data-testid="viewer-grid"');
    expect(body).toContain('data-testid="viewer-empty"');
  });

  describe("wheel zoom", () => {
    it("handleWheel does not require ctrlKey to zoom", () => {
      expect(frameViewerSource).not.toMatch(/if\s*\(\s*!event\.ctrlKey\s*\)\s*return/);
    });
  });

  describe("zoom/pan transform", () => {
    it("renders a shared viewer stage with the default transform", () => {
      const { body } = render(FrameViewer);

      expect(body).toContain('data-testid="viewer-stage"');
      expect(body).toContain('data-testid="viewer-grid-stage"');
      expect(body).toContain("transform: scale(1) translate(0px, 0px)");
    });

    it("applies the provided scale and pan to the shared viewer stage", () => {
      frameStore.setFrames([makeFrame("a")]);
      const { body } = render(FrameViewer, { props: { scale: 2, panX: 50, panY: -30 } });

      expect(body).toContain('data-testid="viewer-stage"');
      expect(body).toContain('data-testid="viewer-grid-stage"');
      expect(body).toContain('data-testid="viewer-grid"');
      expect(body).toContain('data-testid="frame-canvas"');
      expect(body).toContain("transform: scale(2) translate(50px, -30px)");
    });
  });

  describe("grid centring and fade", () => {
    it("centres the grid pattern and fades it out through a dedicated shell", () => {
      expect(frameViewerSource).toContain("background-position: center center;");
      expect(frameViewerSource).toContain("border-radius: 50%;");
      expect(frameViewerSource).toContain(".viewer-grid-fade");
      expect(frameViewerSource).toContain("transparent 100%");
    });
  });
});
