import { $, $$, browser, expect } from "@wdio/globals";
import {
  jsClick,
  jsSetValue,
  dispatchKey,
  tauriInvoke,
  resetToEmpty,
  loadFixture,
  getEmptyViewerAlignment,
  getToolbarPlaybackAlignment,
} from "../helpers.js";

describe("Studio — open GIF fixture", () => {
  before(async () => {
    await resetToEmpty();
  });

  it("should load frames when clicking Open", async () => {
    // 1. Open the file picker
    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });

    // 2. Navigate to the fixture directory using the path input.
    //    e2e_fixture_dir returns the directory that contains tests/fixtures/test.gif.
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');

    // 3. Wait for test.gif to appear and select it
    const gifEntry = await $('[data-testid="file-picker-entry-test.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-test.gif"]');

    // 4. Confirm the selection
    await jsClick('[data-testid="file-picker-confirm"]');

    // 5. Assert frames loaded
    const status = await $('[data-testid="status-message"]');
    await status.waitForExist({ timeout: 10_000 });
    await expect(status).toHaveText("Loaded 3 frames");
  });

  it("should show the canvas after loading", async () => {
    const canvas = await $('[data-testid="frame-canvas"]');
    await canvas.waitForExist({ timeout: 5_000 });
    await expect(canvas).toBeDisplayed();
  });

  it("keeps playback controls horizontally centred in the toolbar", async () => {
    const result = await getToolbarPlaybackAlignment();

    expect(result).not.toBeNull();
    if (!result) return;

    expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
  });

  it("should centre the loaded GIF within the visible canvas area excluding the inspector", async () => {
    const result = await browser.execute(() => {
      const projectCanvas = document.querySelector('[data-testid="project-canvas"]');
      const canvas = document.querySelector('[data-testid="frame-canvas"]');
      const inspector = document.querySelector('[data-testid="inspector"]');
      if (!(projectCanvas instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
        return null;
      }

      const canvasSurfaceRect = projectCanvas.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const inspectorRect =
        inspector instanceof HTMLElement ? inspector.getBoundingClientRect() : canvasSurfaceRect;

      const visibleRightEdge =
        inspector instanceof HTMLElement ? inspectorRect.left : canvasSurfaceRect.right;
      const visibleCentreX = (canvasSurfaceRect.left + visibleRightEdge) / 2;
      const canvasCentreX = canvasRect.left + canvasRect.width / 2;

      return {
        visibleCentreX,
        canvasCentreX,
        deltaX: canvasCentreX - visibleCentreX,
        canvasSurfaceRect,
        canvasRect,
        inspectorRect: inspector instanceof HTMLElement ? inspectorRect : null,
      };
    });

    expect(result).not.toBeNull();
    if (!result) return;

    expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
  });

  it("should hide the empty canvas", async () => {
    const empty = await $('[data-testid="canvas-empty"]');
    await expect(empty).not.toBeExisting();
  });

  it("should show 3 frame thumbnails in the timeline", async () => {
    const strip = await $('[data-testid="frames-strip"]');
    await expect(strip).toBeDisplayed();

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);
  });

  it("should have the first frame selected by default", async () => {
    const first = await $('[data-testid="frame-thumb-0"]');
    const className = await first.getAttribute("class");
    expect(className).toContain("selected");
  });

  it("should enable the export button", async () => {
    const exportBtn = await $('[data-testid="btn-export"]');
    await expect(exportBtn).not.toBeDisabled();
  });
});

describe("Studio — export GIF", () => {
  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("opens the export save input centred in the application window", async () => {
    await browser.execute(() => {
      window.localStorage.setItem("screeny.e2e.showSaveInput", "1");
    });

    try {
      await jsClick('[data-testid="btn-export"]');

      const dialog = await $('[data-testid="save-input-dialog"]');
      await dialog.waitForExist({ timeout: 5_000 });

      const result = await browser.execute(() => {
        const app = document.querySelector('[data-testid="app"]');
        const toolbar = document.querySelector('[data-testid="toolbar"]');
        const saveInput = document.querySelector('[data-testid="save-input-dialog"]');

        if (
          !(app instanceof HTMLElement) ||
          !(toolbar instanceof HTMLElement) ||
          !(saveInput instanceof HTMLElement)
        ) {
          return null;
        }

        const appRect = app.getBoundingClientRect();
        const toolbarRect = toolbar.getBoundingClientRect();
        const saveInputRect = saveInput.getBoundingClientRect();
        const appCentreX = appRect.left + appRect.width / 2;
        const appCentreY = appRect.top + appRect.height / 2;
        const saveInputCentreX = saveInputRect.left + saveInputRect.width / 2;
        const saveInputCentreY = saveInputRect.top + saveInputRect.height / 2;

        return {
          deltaX: saveInputCentreX - appCentreX,
          deltaY: saveInputCentreY - appCentreY,
          saveInputTop: saveInputRect.top,
          toolbarBottom: toolbarRect.bottom,
        };
      });

      expect(result).not.toBeNull();
      if (!result) return;

      expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.deltaY)).toBeLessThanOrEqual(1);
      expect(result.saveInputTop).toBeGreaterThanOrEqual(result.toolbarBottom);
    } finally {
      const cancel = await $('[data-testid="btn-save-cancel"]');
      if (await cancel.isExisting()) {
        await jsClick('[data-testid="btn-save-cancel"]');
      }
      await browser.execute(() => {
        window.localStorage.removeItem("screeny.e2e.showSaveInput");
      });
    }
  });

  it("should export successfully", async () => {
    await jsClick('[data-testid="btn-export"]');

    const status = await $('[data-testid="status-message"]');
    await status.waitForExist({ timeout: 15_000 });
    await expect(status).toHaveText("Exported successfully");
  });
});

describe("Studio — close project", () => {
  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("should show the Close button and no Open button when frames are loaded", async () => {
    const closeBtn = await $('[data-testid="btn-close"]');
    await closeBtn.waitForExist({ timeout: 5_000 });
    await expect(closeBtn).toBeDisplayed();
    await expect(await $('[data-testid="btn-open"]')).not.toBeExisting();
  });

  it("should show the confirmation dialog when clicking Close", async () => {
    await jsClick('[data-testid="btn-close"]');
    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await expect(dialog).toBeDisplayed();
  });

  it("Ctrl+Q shows the same confirmation dialog when a GIF is open", async () => {
    await jsClick('[data-testid="btn-dialog-cancel"]');
    await dispatchKey("q", { ctrlKey: true });

    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await expect(dialog).toBeDisplayed();
  });

  it("should close the dialog and preserve frames when clicking Cancel", async () => {
    await jsClick('[data-testid="btn-dialog-cancel"]');
    await expect(await $('[data-testid="dialog"]')).not.toBeExisting();
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);
  });

  it("should show the dialog again when clicking Close a second time", async () => {
    await jsClick('[data-testid="btn-close"]');
    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await expect(dialog).toBeDisplayed();
  });

  it("should clear all frames and show the Open button when clicking Continue", async () => {
    await jsClick('[data-testid="btn-dialog-confirm"]');
    const openBtn = await $('[data-testid="btn-open"]');
    await openBtn.waitForExist({ timeout: 5_000 });
    await expect(openBtn).toBeDisplayed();
    await expect(await $('[data-testid="btn-close"]')).not.toBeExisting();
    await expect(await $('[data-testid="inspector"]')).not.toBeExisting();
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(0);
  });

  it("should re-centre the empty canvas after closing the current GIF", async () => {
    const result = await getEmptyViewerAlignment();

    expect(result).not.toBeNull();
    if (!result) return;

    expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
  });
});
