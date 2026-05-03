import { describe, expect, it } from "vitest";
import pageSource from "./+page.svelte?raw";

describe("+page.svelte", () => {
  describe("inspector-aware centering", () => {
    it("closes the splashscreen after the main page has mounted", () => {
      expect(pageSource).toMatch(
        /tick\(\)\.then\(\(\)\s*=>\s*\{[\s\S]{0,80}invoke\("close_splashscreen"\)/,
      );
    });

    it("tracks the load-time base scale separately from the relative zoom factor", () => {
      expect(pageSource).toMatch(/let\s+canvasBaseScale\s*=\s*\$state\(\s*1\s*\)/);
      expect(pageSource).toMatch(/let\s+canvasScale\s*=\s*\$state\(\s*1\s*\)/);
      expect(pageSource).toMatch(
        /<Canvas[\s\S]{0,160}baseScale=\{canvasBaseScale\}[\s\S]{0,120}bind:scale=\{canvasScale\}/,
      );
      expect(pageSource).toMatch(/<ZoomIndicator[\s\S]{0,120}scale=\{zoomIndicatorScale\}/);
    });

    it("tracks a reset target separately from the current canvas state", () => {
      expect(pageSource).toMatch(/let\s+resetCanvasBaseScale\s*=\s*\$state\(\s*1\s*\)/);
      expect(pageSource).toMatch(/let\s+resetCanvasPanX\s*=\s*\$state\(\s*0\s*\)/);
      expect(pageSource).toMatch(/let\s+resetCanvasPanY\s*=\s*\$state\(\s*0\s*\)/);
      expect(pageSource).toMatch(
        /async\s+function\s+resetCanvasView\b[\s\S]{0,220}const\s+canvasState\s*=\s*await\s+getTargetCanvasState\(\)[\s\S]{0,120}setResetCanvasState\(canvasState\)[\s\S]{0,120}setCurrentCanvasState\(canvasState\)/,
      );
      expect(pageSource).toMatch(/isModified=\{isCanvasModified\}/);
    });

    it("passes the current reset target pan into Canvas so the empty state and fade stay aligned", () => {
      expect(pageSource).toMatch(/centreOffsetX=\{resetCanvasPanX\}/);
    });

    it("creates the lifecycle seam in +page with dialog, backend, cancelDecode, and onFirstFrame adapters", () => {
      expect(pageSource).toMatch(
        /createProjectLifecycle\(\s*\{[\s\S]{0,220}dialog,[\s\S]{0,160}backend:\s*tauriGifBackend,[\s\S]{0,160}cancelDecode:\s*cancelCurrentGifDecode,[\s\S]{0,160}onFirstFrame:\s*applyInitialCanvasState/,
      );
    });

    it("routes drag-drop through lifecycle.openFromPath(path) while keeping inline drop errors", () => {
      expect(pageSource).toMatch(/const\s+result\s*=\s*await\s+lifecycle\.openFromPath\(path\)/);
      expect(pageSource).toMatch(/if\s*\(result\.error\)\s*\{[\s\S]{0,40}dropError\s*=\s*result\.error/);
      expect(pageSource).not.toContain("openProjectFromPath");
    });

    it("passes the lifecycle instance into Toolbar", () => {
      expect(pageSource).toMatch(/<Toolbar[\s\S]{0,80}lifecycle=\{lifecycle\}/);
    });

    it("renders page-owned file picker, save input, and close-confirm UI", () => {
      expect(pageSource).toMatch(/\{#if\s+showFilePicker\s*\}[\s\S]{0,120}<FilePicker/);
      expect(pageSource).toMatch(/\{#if\s+showSaveInput\s*\}[\s\S]{0,220}data-testid="save-input-row"/);
      expect(pageSource).toMatch(
        /\{#if\s+lifecycle\.closeRequested\s*\}[\s\S]{0,160}<NotificationDialog[\s\S]{0,220}onConfirm=\{\(\)\s*=>\s*lifecycle\.confirmClose\(\)\}[\s\S]{0,220}onCancel=\{\(\)\s*=>\s*lifecycle\.dismissClose\(\)\}/,
      );
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
        /\$effect\(\(\)\s*=>\s*\{[\s\S]{0,120}inspectorVisible[\s\S]{0,120}inspectorMinimised[\s\S]{0,220}syncResetCanvasState\(\)/,
      );
    });

    it("uses the full canvas width for the drop overlay when the inspector is hidden", () => {
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

    it("does not move the current canvas pan while toggling the inspector", () => {
      const handlerMatch = pageSource.match(
        /function\s+handleWindowKeyDown[\s\S]*?\n  }\n\n  \$effect/,
      );
      expect(handlerMatch?.[0]).toBeDefined();
      expect(handlerMatch?.[0]).not.toContain("canvasPanX");
      expect(handlerMatch?.[0]).not.toContain("canvasPanY");
    });
  });

  describe("cancellation", () => {
    it("delegates backend cancellation through the lifecycle seam instead of calling the Tauri command directly", () => {
      expect(pageSource).not.toContain('invoke("cancel_gif_decode"');
      expect(pageSource).toContain("cancelCurrentGifDecode");
    });
  });

  describe("Ctrl+R keyboard shortcut", () => {
    it("handles ctrlKey + 'r' to reset zoom", () => {
      expect(pageSource).toMatch(/event\.ctrlKey/);
      expect(pageSource).toMatch(/\(event\.key === "r" \|\| event\.key === "R"\)/);
    });

    it("prevents the default reload behaviour before resetting the view", () => {
      expect(pageSource).toMatch(
        /\(event\.key === "r" \|\| event\.key === "R"\)[\s\S]{0,200}event\.preventDefault\(\)[\s\S]{0,80}resetCanvasView\(\)/,
      );
    });
  });
});
