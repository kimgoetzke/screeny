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

/**
 * Set an input's value via JavaScript, bypassing WebdriverIO interactability checks.
 * Dispatches an `input` event so Svelte's bind:value picks up the change.
 */
async function jsSetValue(selector: string, value: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  await browser.execute(
    (el: HTMLInputElement, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    element as unknown as HTMLInputElement,
    value,
  );
}

/**
 * Invoke a Tauri command from within the WebView context.
 * Uses window.__TAURI_INTERNALS__.invoke which is always available in Tauri 2.
 */
async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return browser.execute(
    async (cmd: string, cmdArgs: unknown) => {
      return (window as any).__TAURI_INTERNALS__.invoke(cmd, cmdArgs) as Promise<T>;
    },
    command,
    args ?? {},
  ) as Promise<T>;
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

describe("Studio — GIF playback", () => {
  // 2 frames remain after the delete-frame suite; frame-thumb-1 is selected.

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
  });

  it("should advance the active frame in the timeline during playback", async () => {
    // Playback is running from the previous test. Capture the currently selected frame.
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    let selectedBefore: string | null = null;
    for (const thumb of thumbs) {
      const cls = await thumb.getAttribute("class");
      if (cls?.includes("selected")) {
        selectedBefore = await thumb.getAttribute("data-testid");
        break;
      }
    }

    // Wait long enough for at least one frame advance (frames are typically ~100ms in test fixture)
    await browser.pause(500);

    let selectedAfter: string | null = null;
    for (const thumb of thumbs) {
      const cls = await thumb.getAttribute("class");
      if (cls?.includes("selected")) {
        selectedAfter = await thumb.getAttribute("data-testid");
        break;
      }
    }

    expect(selectedAfter).not.toBe(selectedBefore);
  });

  it("clicking stop should re-enable play, disable stop, and preserve the current frame", async () => {
    // Playback is still running. Record which frame is selected just before stopping.
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    let frameBeforeStop: string | null = null;
    for (const thumb of thumbs) {
      const cls = await thumb.getAttribute("class");
      if (cls?.includes("selected")) {
        frameBeforeStop = await thumb.getAttribute("data-testid");
        break;
      }
    }

    await jsClick('[data-testid="btn-stop"]');

    await expect(await $('[data-testid="btn-play"]')).not.toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).toBeDisabled();

    // The frame should not have changed on stop — no revert to frame 0
    let frameAfterStop: string | null = null;
    for (const thumb of thumbs) {
      const cls = await thumb.getAttribute("class");
      if (cls?.includes("selected")) {
        frameAfterStop = await thumb.getAttribute("data-testid");
        break;
      }
    }

    expect(frameAfterStop).toBe(frameBeforeStop);
  });
});
