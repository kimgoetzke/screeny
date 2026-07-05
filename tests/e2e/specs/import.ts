import { $, browser, expect } from "@wdio/globals";
import {
  getFrameOrder,
  getSelectedThumbId,
  jsClick,
  jsSetValue,
  loadFixture,
  tauriInvoke,
  waitForFrameCount,
} from "../helpers.js";

describe("Studio — import frames", () => {
  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("imports a mismatched GIF after the selected frame and keeps project crop bounds", async () => {
    await jsClick('[data-testid="frame-thumb-1"]');
    expect(await getSelectedThumbId()).toBe("frame-thumb-1");

    await jsClick('[data-testid="btn-import"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    await expect(await $('[data-testid="file-picker-confirm"]')).toHaveText("Import");

    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    await jsClick('[data-testid="file-picker-entry-landscape.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');

    await waitForFrameCount(4, "expected imported landscape frame to be inserted");
    expect(await getFrameOrder()).toEqual(["frame-0", "frame-1", "frame-0-import-1", "frame-2"]);
    expect(await getSelectedThumbId()).toBe("frame-thumb-1");

    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await expect(await $('[data-testid="dialog-message"]')).toHaveText(
      "Imported file has a different aspect ratio and was centred within the current project bounds.",
    );
    await jsClick('[data-testid="btn-dialog-confirm"]');

    const status = await $('[data-testid="status-message"]');
    await expect(status).toHaveText("Imported 1 frame");

    await jsClick('[data-testid="frame-thumb-2"]');
    const canvasSize = await browser.execute(() => {
      const canvas = document.querySelector('[data-testid="frame-canvas"]');
      if (!(canvas instanceof HTMLCanvasElement)) return null;
      return { width: canvas.width, height: canvas.height };
    });

    expect(canvasSize).toEqual({ width: 8, height: 8 });
  });
});
