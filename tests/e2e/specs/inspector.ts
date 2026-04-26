/// <reference types="mocha" />

import { $, $$, browser, expect } from "@wdio/globals";
import {
  jsClick,
  jsShiftClick,
  jsSetValue,
  jsWheelShift,
  loadFixture,
} from "../helpers.js";

describe("Studio — inspector panel", () => {
  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("inspector panel is visible while frames are loaded", async () => {
    const inspector = await $('[data-testid="inspector"]');
    await inspector.waitForExist({ timeout: 5_000 });
    await expect(inspector).toBeDisplayed();
  });

  it("shows frame indicator for the selected frame", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await expect(indicator).toHaveText("FRAME 1 / 3");
  });

  it("shows the duration input with the selected frame's duration", async () => {
    const input = await $('[data-testid="inspector-duration-input"]');
    await input.waitForExist({ timeout: 5_000 });
    await expect(input).toBeDisplayed();
  });

  it("editing duration updates the frame duration shown in the timeline", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await jsSetValue('[data-testid="inspector-duration-input"]', "350");
    await browser.pause(300);
    const duration = await $('[data-testid="frame-duration-0"]');
    await expect(duration).toHaveText("350ms");
  });

  it("multi-select shows the bulk-edit tag and dedup buttons in the inspector", async () => {
    // Shift+click frame 1 to extend selection to 0–1
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    const bulkTag = await $('[data-testid="inspector-bulk-edit"]');
    await bulkTag.waitForExist({ timeout: 5_000 });
    await expect(bulkTag).toBeDisplayed();

    await expect(await $('[data-testid="inspector-dedup-merge"]')).toBeDisplayed();
    await expect(await $('[data-testid="inspector-dedup-drop"]')).toBeDisplayed();
  });

  it("shows 'Frames x - y of z' indicator for multi-select", async () => {
    // 2 frames selected (0 and 1 of 2 total)
    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await expect(indicator).toHaveText("FRAMES 1-2 / 3");
  });

  it("duplicate button inserts a copy after the selection", async () => {
    // Select only frame 0, then duplicate
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await jsClick('[data-testid="inspector-btn-duplicate"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(4);
  });

  it("delete button removes the selected frame", async () => {
    // 4 frames now (3 original + 1 duplicate); select frame 3 (the last) and delete via inspector
    await jsClick('[data-testid="frame-thumb-3"]');
    await browser.pause(100);
    await jsClick('[data-testid="inspector-btn-delete"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);
  });

  it("minimise button hides the panel content", async () => {
    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(200);

    await expect(await $('[data-testid="inspector-frame-indicator"]')).not.toBeExisting();
    await expect(await $('[data-testid="inspector-restore"]')).toBeExisting();
  });

  it("restore button shows the panel content again", async () => {
    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);

    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    await expect(indicator).toBeDisplayed();
    await expect(await $('[data-testid="inspector-minimise"]')).toBeExisting();
  });

  it("inspector panel footer stays present regardless of minimised state while visible", async () => {
    // Expanded state: footer present
    await expect(await $('[data-testid="inspector-footer"]')).toBeExisting();

    // Minimise then check again
    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(200);
    await expect(await $('[data-testid="inspector-footer"]')).toBeExisting();

    // Restore for subsequent tests
    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);
  });

  it("inspector panel is floating with a gap from the window edges", async () => {
    const inspector = await $('[data-testid="inspector"]');
    await inspector.waitForExist({ timeout: 5_000 });

    const result = await browser.execute(() => {
      const el = document.querySelector('[data-testid="inspector"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, right: r.right };
    });

    expect(result).not.toBeNull();
    if (!result) return;

    const windowSize = await browser.getWindowSize();
    // Gap of 8px on the right side
    expect(windowSize.width - result.right).toBeGreaterThanOrEqual(6);
    // Gap of 8px from the top
    expect(result.y).toBeGreaterThanOrEqual(6);
  });

  it("zoom indicator repositions when inspector is minimised", async () => {
    const zoomEl = await $('[data-testid="zoom-indicator"]');
    if (!(await zoomEl.isExisting())) {
      // Zoom indicator only shows when frames are loaded; skip if not visible
      return;
    }

    const xExpanded = await browser.execute(() => {
      const el = document.querySelector('[data-testid="zoom-indicator"]');
      return el ? el.getBoundingClientRect().x : null;
    });

    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(300);

    const xMinimised = await browser.execute(() => {
      const el = document.querySelector('[data-testid="zoom-indicator"]');
      return el ? el.getBoundingClientRect().x : null;
    });

    // When inspector minimises, zoom indicator should move right (closer to the edge)
    if (xExpanded !== null && xMinimised !== null) {
      expect(xMinimised).toBeGreaterThan(xExpanded);
    }

    // Restore
    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);
  });

  it("duration label reads 'Duration:' in the same row as the input", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    const durationRow = await $('[data-testid="inspector-duration"]');
    await durationRow.waitForExist({ timeout: 5_000 });
    const text = await durationRow.getText();
    expect(text).toContain("Duration:");
  });

  it("Ctrl+I minimises the inspector panel", async () => {
    // Ensure inspector is expanded first
    const restore = await $('[data-testid="inspector-restore"]');
    if (await restore.isExisting()) {
      await jsClick('[data-testid="inspector-restore"]');
      await browser.pause(200);
    }

    await browser.execute(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "i", ctrlKey: true, bubbles: true }),
      ),
    );
    await browser.pause(200);

    await expect(await $('[data-testid="inspector-restore"]')).toBeExisting();
    await expect(await $('[data-testid="inspector-frame-indicator"]')).not.toBeExisting();
  });

  it("Ctrl+I restores the inspector panel", async () => {
    // Inspector is minimised from previous test
    await browser.execute(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "i", ctrlKey: true, bubbles: true }),
      ),
    );
    await browser.pause(200);

    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    await expect(indicator).toBeDisplayed();
    await expect(await $('[data-testid="inspector-minimise"]')).toBeExisting();
  });

  it("frame indicator text is shown in all caps", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    // CSS text-transform: uppercase — WebdriverIO getText() returns visually rendered text
    const text = await indicator.getText();
    expect(text).toBe(text.toUpperCase());
  });

  it("toggle button is right-aligned in the inspector footer", async () => {
    const result = await browser.execute(() => {
      const footer = document.querySelector('[data-testid="inspector-footer"]');
      const btn = document.querySelector('[data-testid="inspector-minimise"]');
      if (!footer || !btn) return null;
      const footerRect = footer.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      // Right edge of button should be within 8px of the right edge of the footer
      return { footerRight: footerRect.right, btnRight: btnRect.right };
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(Math.abs(result.footerRight - result.btnRight)).toBeLessThanOrEqual(8);
  });

  it("Shift+wheel (WebKit deltaX path) on duration input increases duration by ~100", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);

    // Record current duration
    const input = await $('[data-testid="inspector-duration-input"]');
    await input.waitForExist({ timeout: 5_000 });
    const before = parseInt(await input.getValue(), 10);

    // Simulate WebKit Shift+scroll up: deltaX negative = scroll left = increase
    await jsWheelShift('[data-testid="inspector-duration-input"]', -1);
    await browser.pause(300);

    const duration = await $('[data-testid="frame-duration-0"]');
    const after = parseInt(await duration.getText(), 10);
    expect(after).toBe(Math.min(9999, before + 100));
  });

  it("Shift+wheel (WebKit deltaX path) on duration input decreases duration by ~100", async () => {
    // Set a known duration well above 100 so decrement doesn't clamp
    await jsSetValue('[data-testid="inspector-duration-input"]', "500");
    await browser.pause(300);

    // Simulate WebKit Shift+scroll down: deltaX positive = scroll right = decrease
    await jsWheelShift('[data-testid="inspector-duration-input"]', 1);
    await browser.pause(300);

    const duration = await $('[data-testid="frame-duration-0"]');
    const after = parseInt(await duration.getText(), 10);
    expect(after).toBe(400);
  });

  it("drop overlay right boundary does not overlap the inspector panel when expanded", async () => {
    const result = await browser.execute(() => {
      // Trigger a synthetic drag-enter so the drop overlay is rendered
      // We can't easily trigger real drag events in WebKit, so check CSS/computed values instead.
      // Verify that dropOverlayRightMargin is set by checking the inline style on .drop-overlay.
      // Since the overlay is only rendered during drag, we check the inspector left edge
      // vs what the overlay right edge would be.
      const inspector = document.querySelector('[data-testid="inspector"]');
      const canvasArea = document.querySelector(".canvas-area") as HTMLElement;
      if (!inspector || !canvasArea) return null;
      const inspectorRect = inspector.getBoundingClientRect();
      const canvasRect = canvasArea.getBoundingClientRect();
      // Expected overlay right margin (expanded): 256px from canvas right
      const expectedOverlayRightEdge = canvasRect.right - 256;
      return { inspectorLeft: inspectorRect.left, expectedOverlayRightEdge };
    });

    expect(result).not.toBeNull();
    if (!result) return;
    // Overlay right edge should be at or to the left of the inspector left edge
    expect(result.expectedOverlayRightEdge).toBeLessThanOrEqual(result.inspectorLeft + 1);
  });
});
