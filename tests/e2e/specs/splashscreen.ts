/**
 * E2E tests for the splashscreen.
 *
 * In E2E mode the splashscreen window is kept open after the main window
 * becomes visible so these tests can inspect its rendered content.
 * `e2e_close_splashscreen` tears it down afterwards.
 *
 * Prerequisites: same as studio.ts (built binary, tauri-driver, SCREENY_E2E=1).
 */

/// <reference types="mocha" />

import { $, browser, expect } from "@wdio/globals";

describe("Splashscreen — rendering", () => {
  let mainHandle: string;
  let splashHandle: string | undefined;

  before(async () => {
    // Give both windows time to finish loading before inspecting handles.
    await browser.pause(2_000);

    mainHandle = await browser.getWindowHandle();
    const allHandles = await browser.getWindowHandles();
    splashHandle = allHandles.find((h) => h !== mainHandle);
  });

  after(async () => {
    // Ensure we are back on the main window before closing the splashscreen,
    // so subsequent studio tests start in the correct context.
    await browser.switchToWindow(mainHandle);
    await browser.execute(() => {
      (window as any).__TAURI_INTERNALS__.invoke("e2e_close_splashscreen");
    });
    await browser.pause(500);
  });

  it("should open a second window for the splashscreen", () => {
    expect(splashHandle).toBeDefined();
  });

  it("should render the logo wrapper with non-zero dimensions", async () => {
    if (!splashHandle) return;

    await browser.switchToWindow(splashHandle);

    // Check the concrete .logo div — div box dimensions are more reliably
    // reported by WebKitWebDriver than SVG element rects.
    const logo = await $(".logo");
    await logo.waitForExist({ timeout: 5_000 });
    await expect(logo).toBeDisplayed();

    // Use getBoundingClientRect via JS as a belt-and-braces check alongside
    // getSize(), since WebdriverIO's getSize() can return 0 for SVG-related
    // elements in some WebKitGTK builds even when they are visible.
    const rect = await browser.execute((el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    }, logo as unknown as HTMLElement);

    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  it("should contain an SVG element inside the logo wrapper", async () => {
    if (!splashHandle) return;

    await browser.switchToWindow(splashHandle);

    const svg = await $(".logo svg");
    await svg.waitForExist({ timeout: 5_000 });
    await expect(svg).toBeDisplayed();
  });

  it("should display the app name text", async () => {
    if (!splashHandle) return;

    await browser.switchToWindow(splashHandle);

    const title = await $("[data-testid='splash-title']");
    await expect(title).toBeDisplayed();
    await expect(title).toHaveText("SCREENY");
  });

  it("should display the app version text", async () => {
    if (!splashHandle) return;

    await browser.switchToWindow(splashHandle);

    const version = await $("[data-testid='splash-version']");
    await expect(version).toBeDisplayed();

    const versionText = await version.getText();
    expect(versionText).toMatch(/^Version \S+/);
    expect(versionText).not.toContain("Loading");
  });
});
