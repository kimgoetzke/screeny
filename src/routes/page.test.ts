import { describe, expect, it } from "vitest";
import pageSource from "./+page.svelte?raw";

describe("+page.svelte", () => {
  describe("inspector-aware centering", () => {
    it("seeds and resets horizontal pan from the current inspector-aware offset", () => {
      expect(pageSource).toMatch(/let\s+resetViewerPanX\s*=\s*\$derived\(\s*-\(dropOverlayRightMargin\s*\/\s*2\)\s*\)/);
      expect(pageSource).toMatch(/const\s+EXPANDED_DROP_OVERLAY_RIGHT_MARGIN\s*=\s*265/);
      expect(pageSource).toMatch(/let\s+viewerPanX\s*=\s*\$state\(\s*-\(EXPANDED_DROP_OVERLAY_RIGHT_MARGIN\s*\/\s*2\)\s*\)/);
      expect(pageSource).toMatch(/function\s+resetView\b[\s\S]{0,120}viewerPanX\s*=\s*resetViewerPanX/);
    });

    it("treats the current inspector-aware offset as the unmodified reset state", () => {
      expect(pageSource).toMatch(/isModified=\{viewerScale !== 1 \|\| viewerPanX !== resetViewerPanX \|\| viewerPanY !== 0\}/);
    });

    it("passes centreOffsetX to FrameViewer so the empty state and fade are inspector-aware", () => {
      expect(pageSource).toMatch(/centreOffsetX=\{resetViewerPanX\}/);
    });

    it("handleDrop calls resetView after loading", () => {
      expect(pageSource).toMatch(/async\s+function\s+handleDrop\b[\s\S]{0,1000}resetView\s*\(\s*\)/);
    });

    it("Toolbar receives onLoad prop pointing to resetView", () => {
      expect(pageSource).toMatch(/<Toolbar[\s\S]{0,100}onLoad\s*=\s*\{?\s*resetView\s*\}?/);
    });

    it("tracks inspector visibility from frameStore.hasFrames", () => {
      expect(pageSource).toMatch(/let\s+inspectorVisible\s*=\s*\$derived\(\s*frameStore\.hasFrames\s*\)/);
    });

    it("only renders the inspector while frames are loaded", () => {
      expect(pageSource).toMatch(
        /\{#if\s+inspectorVisible\s*\}[\s\S]{0,80}<Inspector\s+bind:minimised=\{inspectorMinimised\}\s*\/>[\s\S]{0,20}\{\/if\}/,
      );
    });

    it("uses the full viewer width for the drop overlay when the inspector is hidden", () => {
      expect(pageSource).toMatch(
        /let\s+visibleDropOverlayRightMargin\s*=\s*\$derived\(\s*inspectorVisible\s*\?\s*dropOverlayRightMargin\s*:\s*10\s*\)/,
      );
      expect(pageSource).toMatch(/style:margin-right="\{visibleDropOverlayRightMargin\}px"/);
    });
  });

  describe("Ctrl+I keyboard shortcut", () => {
    it("registers a window-level keydown listener", () => {
      expect(pageSource).toContain("keydown");
      expect(pageSource).toMatch(/window\.addEventListener\s*\(\s*["']keydown["']/);
    });

    it("handles ctrlKey + 'i' to toggle the inspector", () => {
      expect(pageSource).toMatch(/ctrlKey/);
      expect(pageSource).toMatch(/key\s*[!=]==\s*["'][iI]["']/);
    });

    it("references inspectorMinimised when handling Ctrl+I", () => {
      expect(pageSource).toContain("inspectorMinimised");
    });

    it("does not move the current viewer pan while toggling the inspector", () => {
      const handlerMatch = pageSource.match(
        /function\s+handleWindowKeyDown[\s\S]*?\n  }\n\n  \$effect/,
      );
      expect(handlerMatch?.[0]).toBeDefined();
      expect(handlerMatch?.[0]).not.toContain("viewerPanX");
      expect(handlerMatch?.[0]).not.toContain("viewerPanY");
    });
  });

  describe("Ctrl+R keyboard shortcut", () => {
    it("handles ctrlKey + 'r' to reset zoom", () => {
      expect(pageSource).toMatch(/event\.ctrlKey/);
      expect(pageSource).toMatch(/\(event\.key === "r" \|\| event\.key === "R"\)/);
    });

    it("prevents the default reload behaviour before resetting the view", () => {
      expect(pageSource).toMatch(
        /\(event\.key === "r" \|\| event\.key === "R"\)[\s\S]{0,200}event\.preventDefault\(\)[\s\S]{0,80}resetView\(\)/,
      );
    });
  });
});
