import { describe, expect, it } from "vitest";
import pageSource from "./+page.svelte?raw";

describe("+page.svelte", () => {
  describe("inspector-aware centering", () => {
    it("tracks the load-time base scale separately from the relative zoom factor", () => {
      expect(pageSource).toMatch(/let\s+viewerBaseScale\s*=\s*\$state\(\s*1\s*\)/);
      expect(pageSource).toMatch(/let\s+viewerScale\s*=\s*\$state\(\s*1\s*\)/);
      expect(pageSource).toMatch(
        /<FrameViewer[\s\S]{0,160}baseScale=\{viewerBaseScale\}[\s\S]{0,120}bind:scale=\{viewerScale\}/,
      );
      expect(pageSource).toMatch(/<ZoomIndicator[\s\S]{0,120}scale=\{zoomIndicatorScale\}/);
    });

    it("tracks a reset target separately from the current viewer state", () => {
      expect(pageSource).toMatch(/let\s+resetViewerBaseScale\s*=\s*\$state\(\s*1\s*\)/);
      expect(pageSource).toMatch(/let\s+resetViewerPanX\s*=\s*\$state\(\s*0\s*\)/);
      expect(pageSource).toMatch(/let\s+resetViewerPanY\s*=\s*\$state\(\s*0\s*\)/);
      expect(pageSource).toMatch(
        /async\s+function\s+resetView\b[\s\S]{0,220}const\s+viewerState\s*=\s*await\s+getTargetViewerState\(\)[\s\S]{0,120}setResetViewerState\(viewerState\)[\s\S]{0,120}setCurrentViewerState\(viewerState\)/,
      );
      expect(pageSource).toMatch(/isModified=\{isViewerModified\}/);
    });

    it("passes the current reset target pan into FrameViewer so the empty state and fade stay aligned", () => {
      expect(pageSource).toMatch(/centreOffsetX=\{resetViewerPanX\}/);
    });

    it("applies the computed initial viewer state when the first streamed frame arrives", () => {
      expect(pageSource).toMatch(/async\s+function\s+applyInitialViewerState\b/);
      expect(pageSource).toMatch(
        /event\.type === "frame"[\s\S]{0,200}frameStore\.addFrame\(event\.data\)[\s\S]{0,260}applyInitialViewerState\(\)/,
      );
    });

    it("does not reapply the computed initial viewer state after loading completes", () => {
      const handleDropMatch = pageSource.match(/async\s+function\s+handleDrop\b[\s\S]*?\n  }\n<\/script>/);
      expect(handleDropMatch?.[0]).toBeDefined();
      expect(handleDropMatch?.[0]).not.toMatch(/finally\s*\{[\s\S]{0,220}applyInitialViewerState\(\)/);
    });

    it("records total frames from the start event before frame updates begin", () => {
      expect(pageSource).toMatch(
        /event\.type === "start"[\s\S]{0,120}frameStore\.setLoadingTotalFrames\(event\.data\.totalFrames\)/,
      );
    });

    it("waits for a paint boundary before decode starts and before loading clears", () => {
      expect(pageSource).toMatch(
        /async\s+function\s+handleDrop\b[\s\S]{0,400}frameStore\.startLoading\(\)[\s\S]{0,240}await\s+waitForNextPaint\(\)[\s\S]{0,900}invoke\("decode_gif_stream"/,
      );
      expect(pageSource).toMatch(
        /async\s+function\s+handleDrop\b[\s\S]{0,2000}finally\s*\{[\s\S]{0,240}await\s+waitForNextPaint\(\)[\s\S]{0,200}frameStore\.finishLoading\(\)/,
      );
    });

    it("Toolbar receives onLoad prop pointing to the initial-fit loader", () => {
      expect(pageSource).toMatch(/<Toolbar[\s\S]{0,100}onLoad\s*=\s*\{?\s*applyInitialViewerState\s*\}?/);
    });

    it("tracks inspector visibility from frameStore.hasFrames", () => {
      expect(pageSource).toMatch(/let\s+inspectorVisible\s*=\s*\$derived\(\s*frameStore\.hasFrames\s*\)/);
    });

    it("only renders the inspector while frames are loaded", () => {
      expect(pageSource).toMatch(
        /\{#if\s+inspectorVisible\s*\}[\s\S]{0,80}<Inspector\s+bind:minimised=\{inspectorMinimised\}\s*\/>[\s\S]{0,20}\{\/if\}/,
      );
    });

    it("refreshes the reset target when the inspector layout changes", () => {
      expect(pageSource).toMatch(
        /\$effect\(\(\)\s*=>\s*\{[\s\S]{0,120}inspectorVisible[\s\S]{0,120}inspectorMinimised[\s\S]{0,220}syncResetViewerState\(\)/,
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
