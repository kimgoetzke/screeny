import { $, browser, expect } from "@wdio/globals";
import { jsClick, resetPlaybackState, getSelectedThumbId, loadFixture } from "../helpers.js";

describe("Studio — GIF playback", () => {
  before(async () => {
    await loadFixture("playback.gif", 3);
  });

  it("should show play and stop buttons after frames are loaded", async () => {
    const playBtn = await $('[data-testid="btn-play"]');
    await playBtn.waitForExist({ timeout: 5_000 });
    await expect(playBtn).toBeDisplayed();
    await expect(await $('[data-testid="btn-stop"]')).toBeDisplayed();
  });

  it("play button should be enabled and stop button should be disabled initially", async () => {
    await expect(await $('[data-testid="btn-play"]')).not.toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).toBeDisabled();
  });

  it("clicking play should disable the play button and enable the stop button", async () => {
    await jsClick('[data-testid="btn-play"]');

    await expect(await $('[data-testid="btn-play"]')).toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).not.toBeDisabled();

    await jsClick('[data-testid="btn-stop"]');
  });

  it("should advance the active frame in the timeline during playback", async () => {
    await resetPlaybackState();

    const selectedBefore = await getSelectedThumbId();
    expect(selectedBefore).toBe("frame-thumb-0");

    await jsClick('[data-testid="btn-play"]');
    await expect(await $('[data-testid="btn-play"]')).toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).not.toBeDisabled();

    let advancedTo: string | null = null;
    await browser.waitUntil(
      async () => {
        const current = await getSelectedThumbId();
        if (current !== null && current !== selectedBefore) {
          advancedTo = current;
          return true;
        }
        return false;
      },
      { timeout: 4_000, timeoutMsg: "Active frame did not advance within 4 s", interval: 75 },
    );

    await jsClick('[data-testid="btn-stop"]');

    expect(advancedTo).not.toBe(selectedBefore);
  });

  it("clicking stop should re-enable play, disable stop, and preserve the current frame", async () => {
    await resetPlaybackState();

    const selectedBefore = await getSelectedThumbId();
    expect(selectedBefore).toBe("frame-thumb-0");

    await jsClick('[data-testid="btn-play"]');
    await expect(await $('[data-testid="btn-play"]')).toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).not.toBeDisabled();

    await browser.waitUntil(
      async () => {
        const current = await getSelectedThumbId();
        return current !== null && current !== selectedBefore;
      },
      { timeout: 4_000, timeoutMsg: "Active frame did not advance before stop", interval: 75 },
    );

    await jsClick('[data-testid="btn-stop"]');

    await expect(await $('[data-testid="btn-play"]')).not.toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).toBeDisabled();

    const frameAtStop = await getSelectedThumbId();

    await browser.pause(700);

    expect(await getSelectedThumbId()).toBe(frameAtStop);
  });
});
