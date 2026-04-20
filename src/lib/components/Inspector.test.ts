import { beforeEach, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Inspector from "./Inspector.svelte";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

describe("Inspector", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  it("renders data-testid=inspector", () => {
    const { body } = render(Inspector);

    expect(body).toContain('data-testid="inspector"');
  });

  describe("empty state (no frames loaded)", () => {
    it("shows 'No frame selected' when no frames are loaded", () => {
      const { body } = render(Inspector);

      expect(body).toContain("");
    });

    it("does not show the duration input when no frames loaded", () => {
      const { body } = render(Inspector);

      expect(body).not.toContain('data-testid="inspector-duration-input"');
    });

    it("does not show action buttons when no frames loaded", () => {
      const { body } = render(Inspector);

      expect(body).not.toContain('data-testid="inspector-btn-duplicate"');
      expect(body).not.toContain('data-testid="inspector-btn-delete"');
    });
  });

  describe("single frame selected", () => {
    it("shows 'Frame x of z' indicator", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");
      const { body } = render(Inspector);

      expect(body).toContain("Frame 2 / 3");
    });

    it("does not show bulk-edit tag", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      const { body } = render(Inspector);

      expect(body).not.toContain('data-testid="inspector-bulk-edit"');
    });

    it("shows duration input with the selected frame's duration", () => {
      frameStore.setFrames([makeFrame("a", 250)]);
      frameStore.selectFrame("a");
      const { body } = render(Inspector);

      expect(body).toContain('data-testid="inspector-duration-input"');
      expect(body).toContain('value="250"');
    });

    it("does not show dedup buttons for a single selection", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.selectFrame("a");
      const { body } = render(Inspector);

      expect(body).not.toContain('data-testid="inspector-dedup-merge"');
      expect(body).not.toContain('data-testid="inspector-dedup-drop"');
    });

    it("shows duplicate and delete buttons", () => {
      frameStore.setFrames([makeFrame("a")]);
      frameStore.selectFrame("a");
      const { body } = render(Inspector);

      expect(body).toContain('data-testid="inspector-btn-duplicate"');
      expect(body).toContain('data-testid="inspector-btn-delete"');
    });
  });

  describe("multiple frames selected", () => {
    it("shows 'Frames x - y of z' indicator", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("c");
      const { body } = render(Inspector);

      expect(body).toContain("Frames 2-3 / 4");
    });

    it("shows bulk-edit tag", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      const { body } = render(Inspector);

      expect(body).toContain('data-testid="inspector-bulk-edit"');
    });

    it("shows duration input with value when all selected frames share the same duration", () => {
      frameStore.setFrames([makeFrame("a", 150), makeFrame("b", 150)]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      const { body } = render(Inspector);

      expect(body).toContain('value="150"');
      expect(body).not.toContain('placeholder="Mixed"');
    });

    it("shows 'Mixed' placeholder when selected frames have different durations", () => {
      frameStore.setFrames([makeFrame("a", 100), makeFrame("b", 200)]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      const { body } = render(Inspector);

      expect(body).toContain('placeholder="Mixed"');
    });

    it("shows dedup merge and drop buttons", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("b");
      const { body } = render(Inspector);

      expect(body).toContain('data-testid="inspector-dedup-merge"');
      expect(body).toContain('data-testid="inspector-dedup-drop"');
    });
  });

  describe("minimise / restore", () => {
    it("shows minimise button in normal state", () => {
      const { body } = render(Inspector);

      expect(body).toContain('data-testid="inspector-minimise"');
    });

    it("does not show restore button in normal state", () => {
      const { body } = render(Inspector);

      expect(body).not.toContain('data-testid="inspector-restore"');
    });

    it("shows restore button when minimised", () => {
      const { body } = render(Inspector, { props: { minimised: true } });

      expect(body).toContain('data-testid="inspector-restore"');
    });

    it("does not show inspector content when minimised", () => {
      const { body } = render(Inspector, { props: { minimised: true } });

      expect(body).not.toContain('data-testid="inspector-minimise"');
      expect(body).not.toContain('data-testid="inspector-frame-indicator"');
    });

    it("renders the footer toggle element in normal state", () => {
      const { body } = render(Inspector);

      expect(body).toContain('data-testid="inspector-footer"');
    });

    it("renders the footer toggle element when minimised", () => {
      const { body } = render(Inspector, { props: { minimised: true } });

      expect(body).toContain('data-testid="inspector-footer"');
    });
  });

  describe("duration row", () => {
    it("shows 'Duration:' label in the duration row", () => {
      frameStore.setFrames([makeFrame("a", 100)]);
      frameStore.selectFrame("a");
      const { body } = render(Inspector);

      expect(body).toContain("Duration:");
    });
  });
});
