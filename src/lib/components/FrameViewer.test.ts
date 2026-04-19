import { beforeEach, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import FrameViewer from "./FrameViewer.svelte";
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

  describe("zoom/pan transform", () => {
    it("renders canvas with default transform at scale 1, pan 0,0", () => {
      frameStore.setFrames([makeFrame("a")]);
      const { body } = render(FrameViewer);

      expect(body).toContain("transform: scale(1) translate(0px, 0px)");
    });

    it("renders canvas with provided scale and pan values", () => {
      frameStore.setFrames([makeFrame("a")]);
      const { body } = render(FrameViewer, { props: { scale: 2, panX: 50, panY: -30 } });

      expect(body).toContain("transform: scale(2) translate(50px, -30px)");
    });
  });
});
