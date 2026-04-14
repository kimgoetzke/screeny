/**
 * E2E tests for the Studio MVP flows.
 *
 * Prerequisites:
 *   - Tauri app built (`pnpm tauri build`)
 *   - tauri-driver installed (`cargo install tauri-driver`)
 *   - WebKitWebDriver available on PATH
 *   - SCREENY_E2E=1 set (handled by wdio.conf.ts beforeSession)
 *   - tests/fixtures/test.gif exists (3-frame fixture)
 */

/** Click an element via JavaScript to bypass WebKitWebDriver interactability checks. */
async function jsClick(selector: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 10_000 });
  await browser.execute((el: HTMLElement) => el.click(), element as unknown as HTMLElement);
}

describe("Studio — app launch", () => {
  it("should show the toolbar", async () => {
    const toolbar = await $('[data-testid="toolbar"]');
    await toolbar.waitForExist({ timeout: 10_000 });
    await expect(toolbar).toBeDisplayed();
  });

  it("should show the empty viewer state", async () => {
    const empty = await $('[data-testid="viewer-empty"]');
    await expect(empty).toBeDisplayed();
    await expect(empty).toHaveText(expect.stringContaining("Open or drop a GIF to get started"));
  });

  it("should show the empty timeline state", async () => {
    const empty = await $('[data-testid="timeline-empty"]');
    await expect(empty).toBeDisplayed();
    await expect(empty).toHaveText("No frames loaded");
  });

  it("should have the export button disabled when no frames loaded", async () => {
    const exportBtn = await $('[data-testid="btn-export"]');
    await expect(exportBtn).toBeDisabled();
  });
});

describe("Studio — open GIF fixture", () => {
  it("should load frames when clicking Open", async () => {
    await jsClick('[data-testid="btn-open"]');

    // Wait for the status message to confirm load
    const status = await $('[data-testid="status-message"]');
    await status.waitForExist({ timeout: 10_000 });
    await expect(status).toHaveText("Loaded 3 frames");
  });

  it("should show the canvas after loading", async () => {
    const canvas = await $('[data-testid="frame-canvas"]');
    await canvas.waitForExist({ timeout: 5_000 });
    await expect(canvas).toBeDisplayed();
  });

  it("should hide the empty viewer", async () => {
    const empty = await $('[data-testid="viewer-empty"]');
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

describe("Studio — frame selection", () => {
  it("should select a different frame on click", async () => {
    await jsClick('[data-testid="frame-thumb-1"]');

    const second = await $('[data-testid="frame-thumb-1"]');
    const className = await second.getAttribute("class");
    expect(className).toContain("selected");

    // First should no longer be selected
    const first = await $('[data-testid="frame-thumb-0"]');
    const firstClass = await first.getAttribute("class");
    expect(firstClass).not.toContain("selected");
  });
});

describe("Studio — delete frame", () => {
  it("should delete a frame and update the timeline", async () => {
    // We have 3 frames; delete the last one
    await jsClick('[data-testid="frame-delete-2"]');

    // Wait briefly for the DOM to update
    await browser.pause(500);

    // Should now have 2 frames
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);
  });
});

describe("Studio — export GIF", () => {
  it("should export successfully", async () => {
    await jsClick('[data-testid="btn-export"]');

    const status = await $('[data-testid="status-message"]');
    await status.waitForExist({ timeout: 15_000 });
    await expect(status).toHaveText("Exported successfully");
  });
});
