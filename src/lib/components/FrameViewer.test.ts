import { beforeEach, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import FrameViewer from "./FrameViewer.svelte";
import { frameStore } from "$lib/stores/frames.svelte";

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
});
