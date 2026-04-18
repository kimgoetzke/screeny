import { beforeEach, describe, expect, it } from "vitest";
import { render } from "svelte/server";
import Timeline from "./Timeline.svelte";
import timelineSource from "./Timeline.svelte?raw";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

describe("Timeline", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  it("adds a themed hover state to frame delete buttons", () => {
    frameStore.setFrames([makeFrame("frame-1")]);

    const { body } = render(Timeline);

    expect(body).toContain('data-testid="frame-delete-0"');
    expect(timelineSource).toMatch(
      /\.delete-btn:hover,\s*\.delete-btn:focus-visible\s*\{[^}]*background:\s*var\(--color-error\);/s,
    );
  });

  describe("multi-select rendering", () => {
    it("applies selected class to all frames in the shift-selected range", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c"), makeFrame("d")]);
      frameStore.selectFrame("b");
      frameStore.shiftSelectFrames("d");

      const { body } = render(Timeline);

      // b, c, d should be selected; a should not
      // frame-thumb-0 (a): not selected
      expect(body).toMatch(/data-testid="frame-thumb-0"[^>]*>/);
      // All three selected frames contain "selected" in their class
      expect(body).toContain('data-testid="frame-thumb-1"');
      expect(body).toContain('data-testid="frame-thumb-2"');
      expect(body).toContain('data-testid="frame-thumb-3"');

      // Extract the class attributes for each frame thumb
      const frameThumbPattern = /class="([^"]*)"[^>]*data-testid="frame-thumb-(\d+)"/g;
      const thumbsByIndex: Record<number, string> = {};
      for (const match of body.matchAll(frameThumbPattern)) {
        thumbsByIndex[Number(match[2])] = match[1];
      }

      expect(thumbsByIndex[0]).not.toContain("selected");
      expect(thumbsByIndex[1]).toContain("selected");
      expect(thumbsByIndex[2]).toContain("selected");
      expect(thumbsByIndex[3]).toContain("selected");
    });

    it("only marks the single selected frame when no shift-selection is active", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");

      const { body } = render(Timeline);

      const frameThumbPattern = /class="([^"]*)"[^>]*data-testid="frame-thumb-(\d+)"/g;
      const thumbsByIndex: Record<number, string> = {};
      for (const match of body.matchAll(frameThumbPattern)) {
        thumbsByIndex[Number(match[2])] = match[1];
      }

      expect(thumbsByIndex[0]).not.toContain("selected");
      expect(thumbsByIndex[1]).toContain("selected");
      expect(thumbsByIndex[2]).not.toContain("selected");
    });
  });

  describe("delete count badge", () => {
    it("shows a count badge on selected frames' delete buttons when >1 frames are selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");

      const { body } = render(Timeline);

      expect(body).toContain('data-testid="delete-count-0"');
      expect(body).toContain('data-testid="delete-count-1"');
      expect(body).toContain('data-testid="delete-count-2"');
    });

    it("shows the correct count on the badge", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("a");
      frameStore.shiftSelectFrames("c");

      const { body } = render(Timeline);

      // Each badge shows the total number of selected frames (3)
      expect(body).toMatch(/data-testid="delete-count-0"[^>]*>\s*3\s*</);
    });

    it("does not show a count badge when only one frame is selected", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      frameStore.selectFrame("b");

      const { body } = render(Timeline);

      expect(body).not.toContain('data-testid="delete-count-');
    });
  });

  describe("bulk delete CSS behaviour", () => {
    it("does NOT have a CSS rule that spreads delete button visibility to all selected frames on hover", () => {
      expect(timelineSource).not.toMatch(
        /\.frames-strip:has\(\.frame-thumb\.selected\s+\.delete-btn:hover\)\s+\.frame-thumb\.selected\s+\.delete-btn\s*\{[^}]*opacity:\s*1/s,
      );
    });

    it("does NOT have a CSS rule that spreads the danger hover style to all selected delete buttons", () => {
      expect(timelineSource).not.toMatch(
        /\.frames-strip:has\(\.frame-thumb\.selected\s+\.delete-btn:hover\)\s+\.frame-thumb\.selected\s+\.delete-btn\s*\{[^}]*background:\s*var\(--color-error\)/s,
      );
    });

    it("has a CSS rule that applies a red tint overlay to all selected frames when any selected delete button is hovered", () => {
      expect(timelineSource).toMatch(
        /\.frames-strip:has\(\.frame-thumb\.selected\s+\.delete-btn:hover\)\s+\.frame-thumb\.selected::after\s*\{[^}]*background/s,
      );
    });

    it("has a CSS rule that applies a red tint overlay to any frame when its own delete button is hovered", () => {
      expect(timelineSource).toMatch(
        /\.frame-thumb:has\(\.delete-btn:hover\)::after\s*\{[^}]*background/s,
      );
    });
  });

  describe("Ctrl+A select-all keyboard shortcut", () => {
    it("registers a window-level keydown listener in the $effect", () => {
      expect(timelineSource).toContain("keydown");
      expect(timelineSource).toMatch(/window\.addEventListener\s*\(\s*["']keydown["']/);
    });

    it("handles Ctrl+A by calling selectAllFrames", () => {
      expect(timelineSource).toMatch(/ctrlKey/);
      expect(timelineSource).toMatch(/key\s*[!=]==\s*["']a["']/);
      expect(timelineSource).toContain("selectAllFrames");
    });

    it("calls preventDefault when handling Ctrl+A", () => {
      expect(timelineSource).toContain("preventDefault");
    });

    it("guards against firing inside input or textarea elements", () => {
      expect(timelineSource).toMatch(/INPUT|TEXTAREA|input|textarea/);
    });
  });

  describe("multi-frame drag indicator", () => {
    it("applies being-dragged class to selected frames during a multi-frame pointer drag", () => {
      // Verify that the source wires isDraggingSelection to the being-dragged CSS class
      // so selected frames are visually dimmed while they are being moved.
      expect(timelineSource).toContain("isDraggingSelection");
      expect(timelineSource).toContain("being-dragged");
    });

    it("has a CSS rule that dims being-dragged frames", () => {
      expect(timelineSource).toMatch(/\.frame-thumb\.being-dragged\s*\{[^}]*opacity/s);
    });

    it("has a CSS rule for the insertion bar", () => {
      expect(timelineSource).toMatch(/\.insertion-bar\s*\{[^}]*background:\s*var\(--color-accent\)/s);
    });

    it("applies being-dragged class to the single dragged frame during a single-frame drag", () => {
      // being-dragged must also apply for single-frame drags (not just isDraggingSelection).
      // The condition must reference dragFrameIndex for the non-selection case.
      expect(timelineSource).toMatch(/isBeingDragged.*dragFrameIndex/s);
    });

    it("computes insertion bar X position without adding scrollLeft", () => {
      // insertionX = rect.left - stripRect.left is already content-relative.
      // Adding scrollLeft overcorrects and pushes the bar off-screen when scrolled.
      expect(timelineSource).not.toMatch(/stripRect\.left \+ scrollLeft/);
    });
  });
});
