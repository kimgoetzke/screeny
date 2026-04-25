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

    it("applies the load-time baseScale before the relative zoom factor", () => {
      frameStore.setFrames([makeFrame("a")]);
      const { body } = render(FrameViewer, {
        props: { baseScale: 0.75, scale: 1, panX: 10, panY: -5 },
      });

      expect(body).toContain("transform: scale(0.75) translate(10px, -5px)");
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

  describe("guide lines", () => {
    it("shows guide lines when a GIF is loaded", () => {
      frameStore.setFrames([makeFrame("a")]);
      const { body } = render(FrameViewer);

      expect(body).toContain('data-testid="guide-line-top"');
      expect(body).toContain('data-testid="guide-line-bottom"');
      expect(body).toContain('data-testid="guide-line-left"');
      expect(body).toContain('data-testid="guide-line-right"');
    });

    it("hides guide lines when no GIF is loaded", () => {
      const { body } = render(FrameViewer);

      expect(body).not.toContain('data-testid="guide-line-top"');
      expect(body).not.toContain('data-testid="guide-line-bottom"');
      expect(body).not.toContain('data-testid="guide-line-left"');
      expect(body).not.toContain('data-testid="guide-line-right"');
    });

    it("positions guide lines at the edges of the loaded GIF", () => {
      frameStore.setFrames([makeFrame("a")]); // width: 10, height: 10
      const { body } = render(FrameViewer);

      expect(body).toContain("top: calc(50% - 6px)"); // top line (1px outside top edge)
      expect(body).toContain("top: calc(50% + 4px)"); // bottom line
      expect(body).toContain("left: calc(50% - 6px)"); // left line (1px outside left edge)
      expect(body).toContain("left: calc(50% + 4px)"); // right line
    });
  });

  describe("redraw guard during streaming load", () => {
    it("tracks only selectedFrameId so unrelated frame appends do not retrigger the effect", () => {
      expect(frameViewerSource).toMatch(
        /\$effect\(\(\)\s*=>\s*\{[\s\S]{0,600}frameStore\.selectedFrameId/,
      );
    });

    it("reads the frame data under untrack so the effect does not depend on the frames array", () => {
      expect(frameViewerSource).toContain("untrack");
      expect(frameViewerSource).toMatch(
        /untrack\(\s*\(\)\s*=>\s*frameStore\.(selectedFrame|frames)/,
      );
    });
  });

  describe("inspector-aware centering", () => {
    it("sets the fade mask centre CSS variable from panX", () => {
      frameStore.setFrames([makeFrame("a")]);
      const { body } = render(FrameViewer, { props: { panX: -132.5 } });

      expect(body).toContain("--fade-center-x: calc(50% + -132.5px)");
    });

    it("defaults centreOffsetX to 0 and panX to 0 when props are omitted", () => {
      const { body } = render(FrameViewer);

      expect(body).toContain("translateX(0px)");
      expect(body).toContain("--fade-center-x: calc(50% + 0px)");
    });

    it("keeps the empty state and grid centred while no GIF is loaded", () => {
      const { body } = render(FrameViewer, {
        props: { centreOffsetX: -132.5, panX: -132.5 },
      });

      expect(body).toContain("translateX(0px)");
      expect(body).toContain("--fade-center-x: calc(50% + 0px)");
      expect(body).toContain("transform: scale(1) translate(0px, 0px)");
    });
  });
});
