import { describe, expect, it } from "vitest";
import pageSource from "./+page.svelte?raw";

describe("+page.svelte", () => {
  describe("inspector-aware centering", () => {
    it("resetView sets viewerPanX using dropOverlayRightMargin", () => {
      expect(pageSource).toMatch(/function\s+resetView\b[\s\S]{0,200}dropOverlayRightMargin/);
    });

    it("handleDrop calls resetView after loading", () => {
      expect(pageSource).toMatch(/async\s+function\s+handleDrop\b[\s\S]{0,1000}resetView\s*\(\s*\)/);
    });

    it("Toolbar receives onLoad prop pointing to resetView", () => {
      expect(pageSource).toMatch(/<Toolbar[\s\S]{0,100}onLoad\s*=\s*\{?\s*resetView\s*\}?/);
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
  });
});
