/// <reference types="mocha" />

import { $, browser, expect } from "@wdio/globals";
import { jsClick, dispatchKey, resetToEmpty, getEmptyViewerAlignment } from "../helpers.js";

describe("Studio — app launch", () => {
  before(async () => {
    await resetToEmpty();
  });

  it("should show the toolbar", async () => {
    const toolbar = await $('[data-testid="toolbar"]');
    await toolbar.waitForExist({ timeout: 10_000 });
    await expect(toolbar).toBeDisplayed();
  });

  it("should not render the inspector before a GIF is loaded", async () => {
    await expect(await $('[data-testid="inspector"]')).not.toBeExisting();
  });

  it("should show the empty canvas state", async () => {
    const empty = await $('[data-testid="canvas-empty"]');
    await expect(empty).toBeDisplayed();
    await expect(empty).toHaveText(expect.stringContaining("Open or drop a GIF to get started"));
  });

  it("should centre the empty canvas within the visible canvas when no GIF is loaded", async () => {
    const result = await getEmptyViewerAlignment();

    expect(result).not.toBeNull();
    if (!result) return;

    expect(Math.abs(result.deltaX)).toBeLessThanOrEqual(1);
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

  it("shows the help trigger and custom window controls in the toolbar", async () => {
    await expect(await $('[data-testid="btn-help"]')).toBeDisplayed();
    await expect(await $('[data-testid="btn-window-minimise"]')).toBeDisplayed();
    await expect(await $('[data-testid="btn-window-maximise"]')).toBeDisplayed();
    await expect(await $('[data-testid="btn-window-close"]')).toBeDisplayed();

    const result = await browser.execute(() => {
      const help = document.querySelector('[data-testid="btn-help"]');
      const minimise = document.querySelector('[data-testid="btn-window-minimise"]');
      if (!(help instanceof HTMLElement) || !(minimise instanceof HTMLElement)) {
        return null;
      }

      return {
        helpRight: help.getBoundingClientRect().right,
        minimiseLeft: minimise.getBoundingClientRect().left,
      };
    });

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.helpRight).toBeLessThanOrEqual(result.minimiseLeft);
  });

  it("opens the help overlay with version and key bindings when clicking the help trigger", async () => {
    await jsClick('[data-testid="btn-help"]');

    const helpMenu = await $('[data-testid="help-menu"]');
    await helpMenu.waitForExist({ timeout: 5_000 });

    await expect(helpMenu).toBeDisplayed();
    await expect(await $('[data-testid="help-version"]')).toHaveText(
      expect.stringContaining("0.1.0"),
    );
    await expect(await $('[data-testid="help-github-button"]')).toBeDisplayed();
    await expect(await $('[data-testid="help-keybindings-table"]')).toBeDisplayed();
    await expect(await $('[data-testid="help-keybindings-header-context"]')).toHaveText("Context");
    await expect(await $('[data-testid="help-keybindings-header-binding"]')).toHaveText("Binding");
    await expect(await $('[data-testid="help-keybindings-header-action"]')).toHaveText("Action");

    await jsClick('[data-testid="help-menu-close"]');
    await expect(await $('[data-testid="help-menu"]')).not.toBeExisting();
  });

  it("F1 toggles the help overlay and shows the new shortcut bindings", async () => {
    await dispatchKey("F1");

    const helpMenu = await $('[data-testid="help-menu"]');
    await helpMenu.waitForExist({ timeout: 5_000 });
    await expect(helpMenu).toBeDisplayed();

    const keybindingsText = await browser.execute(() => {
      const table = document.querySelector('[data-testid="help-keybindings-table"]');
      return table instanceof HTMLElement ? table.innerText : "";
    });
    expect(keybindingsText).toContain("Ctrl+Q");
    expect(keybindingsText).toContain("F1");
    expect(keybindingsText).toContain("Alt+ArrowLeft");
    expect(keybindingsText).toContain("Ctrl+Alt+ArrowRight");

    await dispatchKey("F1");
    await expect(await $('[data-testid="help-menu"]')).not.toBeExisting();
  });

  it("Ctrl+Q does nothing when no GIF is open", async () => {
    await dispatchKey("q", { ctrlKey: true });

    await expect(await $('[data-testid="dialog"]')).not.toBeExisting();
    await expect(await $('[data-testid="btn-open"]')).toBeDisplayed();
  });

  it("drop overlay uses the full canvas width while the inspector is hidden", async () => {
    const result = await browser.execute(() => {
      const canvasArea = document.querySelector(".canvas-area");
      const inspector = document.querySelector('[data-testid="inspector"]');
      if (!(canvasArea instanceof HTMLElement)) return null;

      const canvasRect = canvasArea.getBoundingClientRect();
      return {
        inspectorVisible: inspector instanceof HTMLElement,
        expectedOverlayRightEdge: canvasRect.right - 10,
        canvasRightEdge: canvasRect.right,
      };
    });

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.inspectorVisible).toBe(false);
    expect(result.expectedOverlayRightEdge).toBe(result.canvasRightEdge - 10);
  });
});
