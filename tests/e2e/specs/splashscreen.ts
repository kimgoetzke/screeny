/**
 * E2E tests for the splashscreen.
 *
 * In E2E mode the splashscreen window is kept open after the main window
 * becomes visible so these tests can inspect its rendered content.
 * `e2e_close_splashscreen` tears it down afterwards.
 *
 * Prerequisites: same as studio.ts (built binary, tauri-driver, SCREENY_E2E=1).
 */

describe("Splashscreen — rendering", () => {
  let splashHandle: string | undefined;

  before(async () => {
    // The main window is the session's initial window.  The splashscreen is a
    // second window kept alive in E2E mode.  Give both windows time to finish
    // loading before we look for the second handle.
    await browser.pause(2_000);

    const mainHandle = await browser.getWindowHandle();
    const allHandles = await browser.getWindowHandles();
    splashHandle = allHandles.find((h) => h !== mainHandle);
  });

  after(async () => {
    // Close the splashscreen via the main window's Tauri context so the
    // remaining studio tests have a clean single-window environment.
    const mainHandle = await browser.getWindowHandle();
    await browser.switchToWindow(mainHandle);
    await browser.execute(() => {
      (window as any).__TAURI_INTERNALS__.invoke("e2e_close_splashscreen");
    });
    await browser.pause(500);
  });

  it("should open a second window for the splashscreen", () => {
    expect(splashHandle).toBeDefined();
  });

  it("should render an SVG logo with non-zero dimensions", async () => {
    if (!splashHandle) return;

    await browser.switchToWindow(splashHandle);

    const svg = await $("svg");
    await svg.waitForExist({ timeout: 5_000 });
    await expect(svg).toBeDisplayed();

    const size = await svg.getSize();
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  it("should display the app name text", async () => {
    if (!splashHandle) return;

    await browser.switchToWindow(splashHandle);

    const text = await $("p");
    await expect(text).toBeDisplayed();
    await expect(text).toHaveText("screeny");
  });
});
