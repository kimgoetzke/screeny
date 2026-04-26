/// <reference types="mocha" />

import { $, browser, expect } from "@wdio/globals";
import {
  jsClick,
  ctrlWheel,
  loadFixture,
  getLoadedGifFitMetrics,
  waitForZoomReset,
} from "../helpers.js";

describe("Studio — zoom indicator", () => {
  // Entry state: 2 frames loaded (from keyboard navigation suite deleting one).
  // This suite loads its own fixture to be independent.

  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("canvas stage that carries the background grid scales when zooming", async () => {
    const grid = await $('[data-testid="canvas-grid"]');
    await grid.waitForExist({ timeout: 5_000 });

    const transformBefore = await browser.execute(() => {
      const stage = document.querySelector('[data-testid="canvas-stage"]');
      return stage ? getComputedStyle(stage).transform : null;
    });

    await ctrlWheel(-100);
    await browser.pause(300);

    const transformAfter = await browser.execute(() => {
      const stage = document.querySelector('[data-testid="canvas-stage"]');
      return stage ? getComputedStyle(stage).transform : null;
    });

    expect(transformBefore).not.toBeNull();
    expect(transformAfter).not.toBeNull();
    expect(transformAfter).not.toEqual(transformBefore);
  });

  it("Ctrl+wheel zooms in and the indicator updates above 100%", async () => {
    await ctrlWheel(-100); // negative deltaY = zoom in
    await browser.pause(300);
    const text = await (await $('[data-testid="zoom-level"]')).getText();
    expect(parseInt(text)).toBeGreaterThan(100);
  });

  it("reset button appears when zoom is not at 100%", async () => {
    await expect(await $('[data-testid="zoom-reset"]')).toBeExisting();
  });

  it("clicking the reset button resets zoom to 100% and hides the reset button", async () => {
    await jsClick('[data-testid="zoom-reset"]');
    await browser.pause(200);
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
    await expect(await $('[data-testid="zoom-reset"]')).not.toBeExisting();
  });

  it("zoom level persists when navigating between frames", async () => {
    // Zoom in by dispatching three wheel events
    await browser.execute(() => {
      const projectCanvas = document.querySelector('[data-testid="project-canvas"]')!;
      for (let i = 0; i < 3; i++) {
        projectCanvas.dispatchEvent(
          new WheelEvent("wheel", { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true }),
        );
      }
    });
    await browser.pause(300);
    const levelBefore = await (await $('[data-testid="zoom-level"]')).getText();

    // Navigate to the next frame with ArrowRight
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await browser.execute(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
    );
    await browser.pause(200);

    const levelAfter = await (await $('[data-testid="zoom-level"]')).getText();
    expect(levelAfter).toBe(levelBefore);
  });
});

describe("Studio — initial GIF fit", () => {
  let expandedVisibleWidth = 0;

  it("fits a landscape GIF to 70% of the visible width on load with the inspector expanded", async () => {
    const restore = await $('[data-testid="inspector-restore"]');
    if (await restore.isExisting()) {
      await jsClick('[data-testid="inspector-restore"]');
      await browser.pause(200);
    }

    await loadFixture("landscape.gif", 1);

    const result = await getLoadedGifFitMetrics();
    expect(result).not.toBeNull();
    if (!result) return;

    expandedVisibleWidth = result.visibleWidth;

    expect(Math.abs(result.widthRatio - 0.7)).toBeLessThanOrEqual(0.02);
    expect(result.heightRatio).toBeLessThan(0.7);
    expect(result.canvasWidth).toBeLessThanOrEqual(result.visibleWidth + 1);
    expect(result.canvasHeight).toBeLessThanOrEqual(result.visibleHeight + 1);
    expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.deltaY)).toBeLessThanOrEqual(1);
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
  });

  it("fits a portrait GIF to 70% of the visible height when loaded with the inspector minimised", async () => {
    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(200);

    await loadFixture("portrait.gif", 1);

    const result = await getLoadedGifFitMetrics();
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.visibleWidth).toBeGreaterThan(expandedVisibleWidth);
    expect(Math.abs(result.heightRatio - 0.7)).toBeLessThanOrEqual(0.02);
    expect(result.widthRatio).toBeLessThan(0.7);
    expect(result.canvasWidth).toBeLessThanOrEqual(result.visibleWidth + 1);
    expect(result.canvasHeight).toBeLessThanOrEqual(result.visibleHeight + 1);
    expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.deltaY)).toBeLessThanOrEqual(1);
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
  });

  it("reset zoom re-centres the GIF after inspector minimise and restore change the visible canvas width", async () => {
    const restore = await $('[data-testid="inspector-restore"]');
    if (await restore.isExisting()) {
      await jsClick('[data-testid="inspector-restore"]');
      await browser.pause(200);
    }

    await loadFixture("landscape.gif", 1);

    const expandedMetrics = await getLoadedGifFitMetrics();
    expect(expandedMetrics).not.toBeNull();
    if (!expandedMetrics) return;

    await expect(await $('[data-testid="zoom-reset"]')).not.toBeExisting();

    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(200);
    await waitForZoomReset();

    const shiftedMinimisedMetrics = await getLoadedGifFitMetrics();
    expect(shiftedMinimisedMetrics).not.toBeNull();
    if (!shiftedMinimisedMetrics) return;

    expect(shiftedMinimisedMetrics.visibleWidth).toBeGreaterThan(expandedMetrics.visibleWidth);
    expect(Math.abs(shiftedMinimisedMetrics.deltaX)).toBeGreaterThan(1);

    await jsClick('[data-testid="zoom-reset"]');
    await browser.pause(200);

    const resetMinimisedMetrics = await getLoadedGifFitMetrics();
    expect(resetMinimisedMetrics).not.toBeNull();
    if (!resetMinimisedMetrics) return;

    expect(Math.abs(resetMinimisedMetrics.widthRatio - 0.7)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(resetMinimisedMetrics.deltaX)).toBeLessThanOrEqual(1);
    expect(Math.abs(resetMinimisedMetrics.deltaY)).toBeLessThanOrEqual(1);
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
    await expect(await $('[data-testid="zoom-reset"]')).not.toBeExisting();

    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);
    await waitForZoomReset();

    const shiftedExpandedMetrics = await getLoadedGifFitMetrics();
    expect(shiftedExpandedMetrics).not.toBeNull();
    if (!shiftedExpandedMetrics) return;

    expect(shiftedExpandedMetrics.visibleWidth).toBeLessThan(resetMinimisedMetrics.visibleWidth);
    expect(Math.abs(shiftedExpandedMetrics.deltaX)).toBeGreaterThan(1);

    await jsClick('[data-testid="zoom-reset"]');
    await browser.pause(200);

    const resetExpandedMetrics = await getLoadedGifFitMetrics();
    expect(resetExpandedMetrics).not.toBeNull();
    if (!resetExpandedMetrics) return;

    expect(Math.abs(resetExpandedMetrics.widthRatio - 0.7)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(resetExpandedMetrics.deltaX)).toBeLessThanOrEqual(1);
    expect(Math.abs(resetExpandedMetrics.deltaY)).toBeLessThanOrEqual(1);
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
    await expect(await $('[data-testid="zoom-reset"]')).not.toBeExisting();
  });
});
