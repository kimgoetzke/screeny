import { $, $$, browser, expect } from "@wdio/globals";
import {
  jsClick,
  dispatchKey,
  focusElement,
  getActiveTestId,
  getFrameOrder,
  loadFixture,
  waitForFrameCount,
} from "../helpers.js";

describe("Studio — keyboard navigation", () => {
  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("zoom indicator is not visible when no GIF is loaded", async () => {
    // Close the current project to reach empty state
    await jsClick('[data-testid="btn-close"]');
    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="btn-dialog-confirm"]');
    const openBtn = await $('[data-testid="btn-open"]');
    await openBtn.waitForExist({ timeout: 5_000 });
    // In empty state the zoom indicator must not be rendered
    await expect(await $('[data-testid="zoom-indicator"]')).not.toBeExisting();
  });

  it("should load the GIF fixture for keyboard navigation tests", async () => {
    await loadFixture("test.gif", 3);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("zoom indicator shows 100% when a GIF is loaded", async () => {
    const indicator = await $('[data-testid="zoom-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
  });

  it("Alt+ArrowRight and Alt+ArrowLeft move the selected frame by one position", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    const originalOrder = await getFrameOrder();

    await dispatchKey("ArrowRight", { altKey: true });
    await browser.pause(200);
    expect(await getFrameOrder()).toEqual([originalOrder[1], originalOrder[0], originalOrder[2]]);

    await dispatchKey("ArrowLeft", { altKey: true });
    await browser.pause(200);
    expect(await getFrameOrder()).toEqual(originalOrder);
  });

  it("Ctrl+Alt+ArrowRight and Ctrl+Alt+ArrowLeft move the selected frame to the end and back to the start", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    const originalOrder = await getFrameOrder();

    await dispatchKey("ArrowRight", { ctrlKey: true, altKey: true });
    await browser.pause(200);
    expect(await getFrameOrder()).toEqual([originalOrder[1], originalOrder[2], originalOrder[0]]);

    await dispatchKey("ArrowLeft", { ctrlKey: true, altKey: true });
    await browser.pause(200);
    expect(await getFrameOrder()).toEqual(originalOrder);
  });

  it("Tab and Shift+Tab keep cycling focus without landing on frame thumbnails", async () => {
    await focusElement('[data-testid="btn-close"]');
    expect(await getActiveTestId()).toBe("btn-close");

    const visited = new Set<string>();
    for (let index = 0; index < 10; index += 1) {
      await browser.keys("Tab");
      await browser.pause(100);
      const activeTestId = await getActiveTestId();
      if (activeTestId) {
        visited.add(activeTestId);
      }
    }

    expect(visited.has("btn-import")).toBe(true);
    expect(visited.has("btn-export")).toBe(true);
    expect(Array.from(visited).some((testId) => testId.startsWith("frame-thumb-"))).toBe(false);

    await focusElement('[data-testid="btn-export"]');
    await browser.keys(["Shift", "Tab"]);
    await browser.pause(100);
    expect(await getActiveTestId()).toBe("btn-import");
    await browser.keys(["Shift", "Tab"]);
    await browser.pause(100);
    expect(await getActiveTestId()).toBe("btn-close");
  });

  it("ArrowRight moves selection to the next frame", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await dispatchKey("ArrowRight");
    await browser.pause(200);
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("class")).toContain(
      "selected",
    );
    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("class")).not.toContain(
      "selected",
    );
  });

  it("ArrowLeft moves selection to the previous frame", async () => {
    // frame 1 selected from previous test
    await dispatchKey("ArrowLeft");
    await browser.pause(200);
    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("class")).toContain(
      "selected",
    );
  });

  it("Shift+ArrowRight extends selection to include the next frame", async () => {
    // frame 0 selected; Shift+ArrowRight adds frame 1
    await dispatchKey("ArrowRight", { shiftKey: true });
    await browser.pause(200);
    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("class")).toContain(
      "selected",
    );
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("class")).toContain(
      "selected",
    );
  });

  it("Space key starts playback", async () => {
    await jsClick('[data-testid="frame-thumb-0"]'); // reset to single selection
    await browser.pause(100);
    await dispatchKey(" ");
    await browser.pause(200);
    await expect(await $('[data-testid="btn-play"]')).toBeDisabled();
  });

  it("Space key stops playback", async () => {
    await dispatchKey(" ");
    await browser.pause(200);
    await expect(await $('[data-testid="btn-play"]')).not.toBeDisabled();
  });

  it("Delete key removes the selected frame", async () => {
    await jsClick('[data-testid="frame-thumb-1"]'); // select frame 1 only
    await browser.pause(100);
    await dispatchKey("Delete");
    await waitForFrameCount(2, "expected 2 frames after Delete key");
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(2);
  });
});
