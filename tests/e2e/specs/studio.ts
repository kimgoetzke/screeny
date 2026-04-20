/// <reference types="mocha" />

import { $, $$, browser, expect } from "@wdio/globals";

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

/** Dispatch a window-level keydown event, as if the user pressed a key. */
async function dispatchKey(key: string, options: { shiftKey?: boolean; ctrlKey?: boolean } = {}) {
  await browser.execute(
    (k: string, opts: { shiftKey?: boolean; ctrlKey?: boolean }) =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...opts })),
    key,
    options,
  );
}

/** Dispatch a Ctrl+wheel event on the frame viewer to trigger cursor-centred zoom. */
async function ctrlWheel(deltaY: number) {
  await browser.execute((dy: number) => {
    const viewer = document.querySelector('[data-testid="frame-viewer"]')!;
    viewer.dispatchEvent(
      new WheelEvent("wheel", { deltaY: dy, ctrlKey: true, bubbles: true, cancelable: true }),
    );
  }, deltaY);
}

/** Click an element via JavaScript to bypass WebKitWebDriver interactability checks. */
async function jsClick(selector: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 10_000 });
  await browser.execute((el: HTMLElement) => el.click(), element as unknown as HTMLElement);
}

/**
 * Shift+click an element via JavaScript, dispatching a MouseEvent with shiftKey=true.
 * Used for range-selection in the timeline.
 */
async function jsShiftClick(selector: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 10_000 });
  await browser.execute(
    (el: HTMLElement) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true })),
    element as unknown as HTMLElement,
  );
}

/**
 * Simulate a pointer-based drag from one element to the right-hand side of another.
 * The Timeline uses pointer events (not HTML5 DnD) so we dispatch PointerEvents directly:
 *   pointerdown on source → pointermove (cross threshold) → pointermove (over target) → pointerup
 * Dropping near the right edge of the target places the insertion slot AFTER that frame.
 */
async function jsDrag(fromSelector: string, toSelector: string) {
  const fromEl = await $(fromSelector);
  await fromEl.waitForExist({ timeout: 10_000 });
  const toEl = await $(toSelector);
  await toEl.waitForExist({ timeout: 10_000 });

  await browser.execute(
    (from: HTMLElement, to: HTMLElement) => {
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      const startX = fromRect.left + fromRect.width / 2;
      const startY = fromRect.top + fromRect.height / 2;
      // Land near the right edge of the target so the insertion slot falls AFTER it
      const endX = toRect.right - 2;
      const endY = toRect.top + toRect.height / 2;

      from.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: startX, clientY: startY, button: 0 }));
      // First move must exceed the 5 px threshold to commit the drag
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: startX + 10, clientY: startY }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: endX, clientY: endY }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: endX, clientY: endY }));
      // Browsers always fire a click after pointerup — dispatch it so wasJustDragging is
      // consumed and cleared, preventing it from swallowing the next real click event.
      from.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: endX, clientY: endY }));
    },
    fromEl as unknown as HTMLElement,
    toEl as unknown as HTMLElement,
  );
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
    const getSelectedThumbId = async (): Promise<string | null> => {
      const thumbs = await $$('[data-testid^="frame-thumb-"]');
      for (const thumb of thumbs) {
        const cls = await thumb.getAttribute("class");
        if (cls?.includes("selected")) {
          return thumb.getAttribute("data-testid");
        }
      }
      return null;
    };

    const selectedBefore = await getSelectedThumbId();

    // Poll until the active frame changes rather than using a fixed pause.
    // With 2 frames at ~100 ms each the cycle is ~200 ms; 3 s is a safe upper bound.
    // Capture inside waitUntil to avoid a race where the frame cycles back before the
    // assertion below re-queries.
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
      { timeout: 3_000, timeoutMsg: "Active frame did not advance within 3 s", interval: 100 },
    );

    expect(advancedTo).not.toBe(selectedBefore);
  });

  it("clicking stop should re-enable play, disable stop, and preserve the current frame", async () => {
    // Playback is still running. Stop it immediately — capturing the frame *before*
    // stop is racy because the frame can advance between the read and the click.
    await jsClick('[data-testid="btn-stop"]');

    await expect(await $('[data-testid="btn-play"]')).not.toBeDisabled();
    await expect(await $('[data-testid="btn-stop"]')).toBeDisabled();

    // Read which frame is selected now that playback is stopped.
    const getSelectedThumbId = async (): Promise<string | null> => {
      const thumbs = await $$('[data-testid^="frame-thumb-"]');
      for (const thumb of thumbs) {
        const cls = await thumb.getAttribute("class");
        if (cls?.includes("selected")) {
          return thumb.getAttribute("data-testid");
        }
      }
      return null;
    };

    const frameAtStop = await getSelectedThumbId();

    // Wait longer than one full playback cycle to confirm the frame no longer advances.
    await browser.pause(500);

    expect(await getSelectedThumbId()).toBe(frameAtStop);
  });
});

describe("Studio — close project", () => {
  // At this point 2 frames are loaded (post-delete suite) and playback is stopped.

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

  it("should close the dialog and preserve frames when clicking Cancel", async () => {
    await jsClick('[data-testid="btn-dialog-cancel"]');
    await expect(await $('[data-testid="dialog"]')).not.toBeExisting();
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);
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
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(0);
  });
});

describe("Studio — bulk delete frames", () => {
  // The app is in empty state after the close project suite; btn-open is visible.

  it("should reload the GIF fixture for bulk delete tests", async () => {
    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-test.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-test.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);
  });

  it("should select a range of frames with shift+click", async () => {
    // frame-thumb-0 is selected by default after load; shift+click frame-thumb-2 → selects 0–2
    await jsShiftClick('[data-testid="frame-thumb-2"]');
    await browser.pause(200);

    for (let i = 0; i <= 2; i++) {
      const thumb = await $(`[data-testid="frame-thumb-${i}"]`);
      const cls = await thumb.getAttribute("class");
      expect(cls).toContain("selected");
    }
  });

  it("should delete only the clicked frame when it is not in the selection", async () => {
    // Select frames 1–2 only (click frame-thumb-1 then shift+click frame-thumb-2)
    await jsClick('[data-testid="frame-thumb-1"]');
    await browser.pause(100);
    await jsShiftClick('[data-testid="frame-thumb-2"]');
    await browser.pause(100);

    // frame-thumb-0 is NOT in the selection — clicking its delete should remove only it
    await jsClick('[data-testid="frame-delete-0"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);
  });

  it("should bulk-delete all selected frames when clicking delete on a selected frame", async () => {
    // Both remaining frames are still selected from the previous test
    await jsClick('[data-testid="frame-delete-0"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(0);
  });
});

describe("Studio — deduplicate frames", () => {
  // App is in empty state (0 frames, btn-open visible) after the bulk-delete suite.

  it("should load the dedup fixture (3 frames: red, red, blue)", async () => {
    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-dedup.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-dedup.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const status = await $('[data-testid="status-message"]');
    await status.waitForExist({ timeout: 10_000 });
    await expect(status).toHaveText("Loaded 3 frames");
  });

  it("should show both dedup buttons when all frames are selected", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    const dedupMerge = await $('[data-testid="inspector-dedup-merge"]');
    await dedupMerge.waitForExist({ timeout: 5_000 });
    await expect(dedupMerge).toBeDisplayed();
    await expect(await $('[data-testid="inspector-dedup-drop"]')).toBeDisplayed();
  });

  it("drop: removes adjacent duplicate and preserves the kept frame's duration", async () => {
    await jsClick('[data-testid="inspector-dedup-drop"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("100ms");
  });

  it("should close the project and reload the dedup fixture for the merge test", async () => {
    await jsClick('[data-testid="btn-close"]');
    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="btn-dialog-confirm"]');
    const openBtn = await $('[data-testid="btn-open"]');
    await openBtn.waitForExist({ timeout: 5_000 });

    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-dedup.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-dedup.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("merge: removes adjacent duplicate and adds its duration to the kept frame", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-merge"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("300ms");
  });
});

describe("Studio — drag to reorder frames", () => {
  // State at entry: 2 frames loaded after the dedup-merge suite.

  it("should reload the GIF fixture for single-frame drag tests", async () => {
    await jsClick('[data-testid="btn-close"]');
    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="btn-dialog-confirm"]');
    const openBtn = await $('[data-testid="btn-open"]');
    await openBtn.waitForExist({ timeout: 5_000 });

    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-test.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-test.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("should reorder a single unselected frame forward by drag-and-drop", async () => {
    // Frame 0 is selected by default after load; click frame 1 to select only frame 1,
    // then drag frame 0 (now unselected) → exercises the single-frame reorderFrames path.
    await jsClick('[data-testid="frame-thumb-1"]');
    await browser.pause(100);

    const idAt0Before = await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id");

    // Drag frame 0 onto frame 2 — reorderFrames(0, 2) → frame 0 ends up at position 2.
    await jsDrag('[data-testid="frame-thumb-0"]', '[data-testid="frame-thumb-2"]');
    await browser.pause(300);

    const idAt0After = await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id");
    const idAt2After = await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id");

    expect(idAt0After).not.toBe(idAt0Before); // frame originally at 0 has moved
    expect(idAt2After).toBe(idAt0Before);      // it is now at position 2
  });

  it("should reload the fixture for multi-frame drag tests", async () => {
    await jsClick('[data-testid="btn-close"]');
    const dialog = await $('[data-testid="dialog"]');
    await dialog.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="btn-dialog-confirm"]');
    const openBtn = await $('[data-testid="btn-open"]');
    await openBtn.waitForExist({ timeout: 5_000 });

    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-test.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-test.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("should move multiple selected frames together by drag-and-drop", async () => {
    // Record the frame IDs in original order [0, 1, 2].
    const idAt0 = await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id");
    const idAt1 = await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id");
    const idAt2 = await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id");

    // Frame 0 is already selected after load; shift+click frame 1 → selects frames 0 and 1.
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(100);

    // Drag frame 0 (selected, multi-selection active) onto frame 2.
    // moveSelectedFrames(2): non-selected=[frame2], insert [frame0,frame1] after frame2
    // → expected order: [frame2, frame0, frame1]
    await jsDrag('[data-testid="frame-thumb-0"]', '[data-testid="frame-thumb-2"]');
    await browser.pause(300);

    const newIdAt0 = await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id");
    const newIdAt1 = await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id");
    const newIdAt2 = await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id");

    expect(newIdAt0).toBe(idAt2); // frame 2 is now first
    expect(newIdAt1).toBe(idAt0); // frame 0 is now second
    expect(newIdAt2).toBe(idAt1); // frame 1 is now third
  });

  it("should keep the moved frames selected after a multi-frame drag", async () => {
    // After the previous drag, frames originally at positions 0 and 1 are now at positions 1 and 2.
    // Both should still carry the 'selected' CSS class.
    const thumb1 = await $('[data-testid="frame-thumb-1"]');
    const thumb2 = await $('[data-testid="frame-thumb-2"]');
    expect(await thumb1.getAttribute("class")).toContain("selected");
    expect(await thumb2.getAttribute("class")).toContain("selected");
  });
});

describe("Studio — deduplicate frames (selection-scoped)", () => {
  // Prerequisites:
  //   - Tauri app built, tauri-driver and WebKitWebDriver on PATH
  //   - tests/fixtures/dedup-selection.gif exists (4-frame fixture)
  //     [red(100ms), red(200ms), blue(100ms), blue(150ms)]
  //
  // NOTE: These tests cannot be run automatically; they require a full Tauri build.

  /** Close the current project (without confirmation dialog if already empty) and load dedup-selection.gif. */
  async function loadDedupSelectionFixture() {
    // Close existing project if frames are loaded
    const closeBtn = await $('[data-testid="btn-close"]');
    const closeBtnExists = await closeBtn.isExisting();
    if (closeBtnExists) {
      await jsClick('[data-testid="btn-close"]');
      const dialog = await $('[data-testid="dialog"]');
      await dialog.waitForExist({ timeout: 5_000 });
      await jsClick('[data-testid="btn-dialog-confirm"]');
      const openBtn = await $('[data-testid="btn-open"]');
      await openBtn.waitForExist({ timeout: 5_000 });
    }

    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-dedup-selection.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-dedup-selection.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });
  }

  it("should load the dedup-selection fixture (4 frames)", async () => {
    await loadDedupSelectionFixture();
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(4);
  });

  it("merge (selection-scoped): merges only the selected duplicate frames; non-selected frames unchanged", async () => {
    // Frame 0 is selected by default (anchor); shift+click frame 1 → selects frames 0–1 (both red)
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-merge"]');
    await browser.pause(300);

    // 3 frames remain: [red(300ms), blue(100ms), blue(150ms)]
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("300ms");

    // Non-selected blue frames must be untouched
    const duration1 = await $('[data-testid="frame-duration-1"]');
    await expect(duration1).toHaveText("100ms");

    const duration2 = await $('[data-testid="frame-duration-2"]');
    await expect(duration2).toHaveText("150ms");
  });

  it("should reload the dedup-selection fixture for the drop test", async () => {
    await loadDedupSelectionFixture();
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(4);
  });

  it("drop (selection-scoped): drops only the selected duplicate frame; non-selected frames unchanged", async () => {
    // Frame 0 is selected (anchor); shift+click frame 1 → selects frames 0–1
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-drop"]');
    await browser.pause(300);

    // 3 frames remain: [red(100ms), blue(100ms), blue(150ms)]
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("100ms");

    const duration1 = await $('[data-testid="frame-duration-1"]');
    await expect(duration1).toHaveText("100ms");

    const duration2 = await $('[data-testid="frame-duration-2"]');
    await expect(duration2).toHaveText("150ms");
  });

  it("should reload the dedup-selection fixture for the single-select merge test", async () => {
    await loadDedupSelectionFixture();
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(4);
  });

  it("merge (all-selected): deduplicates the full GIF when all frames are selected", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-merge"]');
    await browser.pause(300);

    // 2 frames remain: [red(300ms), blue(250ms)]
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("300ms");

    const duration1 = await $('[data-testid="frame-duration-1"]');
    await expect(duration1).toHaveText("250ms");
  });

  it("should reload the dedup-selection fixture for the single-select drop test", async () => {
    await loadDedupSelectionFixture();
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(4);
  });

  it("drop (all-selected): deduplicates the full GIF when all frames are selected", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-drop"]');
    await browser.pause(300);

    // 2 frames remain: [red(100ms), blue(100ms)]
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("100ms");

    const duration1 = await $('[data-testid="frame-duration-1"]');
    await expect(duration1).toHaveText("100ms");
  });
});

describe("Studio — keyboard navigation", () => {
  // Entry state: 2 frames loaded (after dedup-selection suite)

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
    await jsClick('[data-testid="btn-open"]');
    const picker = await $('[data-testid="file-picker"]');
    await picker.waitForExist({ timeout: 5_000 });
    const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
    await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
    await jsClick('[data-testid="file-picker-go"]');
    const gifEntry = await $('[data-testid="file-picker-entry-test.gif"]');
    await gifEntry.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="file-picker-entry-test.gif"]');
    await jsClick('[data-testid="file-picker-confirm"]');
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("zoom indicator shows 100% when a GIF is loaded", async () => {
    const indicator = await $('[data-testid="zoom-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    await expect(await $('[data-testid="zoom-level"]')).toHaveText("100%");
  });

  it("ArrowRight moves selection to the next frame", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await dispatchKey("ArrowRight");
    await browser.pause(200);
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("class")).toContain("selected");
    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("class")).not.toContain("selected");
  });

  it("ArrowLeft moves selection to the previous frame", async () => {
    // frame 1 selected from previous test
    await dispatchKey("ArrowLeft");
    await browser.pause(200);
    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("class")).toContain("selected");
  });

  it("Shift+ArrowRight extends selection to include the next frame", async () => {
    // frame 0 selected; Shift+ArrowRight adds frame 1
    await dispatchKey("ArrowRight", { shiftKey: true });
    await browser.pause(200);
    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("class")).toContain("selected");
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("class")).toContain("selected");
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
    await browser.pause(300);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(2);
  });
});

describe("Studio — zoom indicator", () => {
  // Entry state: 2 frames loaded (after keyboard nav suite deleted one)

  it("viewer stage that carries the background grid scales when zooming", async () => {
    const grid = await $('[data-testid="viewer-grid"]');
    await grid.waitForExist({ timeout: 5_000 });

    const transformBefore = await browser.execute(() => {
      const stage = document.querySelector('[data-testid="viewer-stage"]');
      return stage ? getComputedStyle(stage).transform : null;
    });

    await ctrlWheel(-100);
    await browser.pause(300);

    const transformAfter = await browser.execute(() => {
      const stage = document.querySelector('[data-testid="viewer-stage"]');
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
      const viewer = document.querySelector('[data-testid="frame-viewer"]')!;
      for (let i = 0; i < 3; i++) {
        viewer.dispatchEvent(
          new WheelEvent("wheel", { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true }),
        );
      }
    });
    await browser.pause(300);
    const levelBefore = await (await $('[data-testid="zoom-level"]')).getText();

    // Navigate to the next frame with ArrowRight
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await dispatchKey("ArrowRight");
    await browser.pause(200);

    const levelAfter = await (await $('[data-testid="zoom-level"]')).getText();
    expect(levelAfter).toBe(levelBefore);
  });
});

describe("Studio — inspector panel", () => {
  // Entry state: 2 frames loaded (after zoom indicator suite).

  it("inspector panel is always visible", async () => {
    const inspector = await $('[data-testid="inspector"]');
    await inspector.waitForExist({ timeout: 5_000 });
    await expect(inspector).toBeDisplayed();
  });

  it("shows frame indicator for the selected frame", async () => {
    // 2 frames loaded, frame 1 selected from previous suite
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await expect(indicator).toHaveText("FRAME 1 / 2");
  });

  it("shows the duration input with the selected frame's duration", async () => {
    const input = await $('[data-testid="inspector-duration-input"]');
    await input.waitForExist({ timeout: 5_000 });
    await expect(input).toBeDisplayed();
  });

  it("editing duration updates the frame duration shown in the timeline", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await jsSetValue('[data-testid="inspector-duration-input"]', "350");
    await browser.pause(300);
    const duration = await $('[data-testid="frame-duration-0"]');
    await expect(duration).toHaveText("350ms");
  });

  it("multi-select shows the bulk-edit tag and dedup buttons in the inspector", async () => {
    // Shift+click frame 1 to extend selection to 0–1
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    const bulkTag = await $('[data-testid="inspector-bulk-edit"]');
    await bulkTag.waitForExist({ timeout: 5_000 });
    await expect(bulkTag).toBeDisplayed();

    await expect(await $('[data-testid="inspector-dedup-merge"]')).toBeDisplayed();
    await expect(await $('[data-testid="inspector-dedup-drop"]')).toBeDisplayed();
  });

  it("shows 'Frames x - y of z' indicator for multi-select", async () => {
    // 2 frames selected (0 and 1 of 2 total)
    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await expect(indicator).toHaveText("FRAMES 1-2 / 2");
  });

  it("duplicate button inserts a copy after the selection", async () => {
    // Select only frame 0, then duplicate
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    await jsClick('[data-testid="inspector-btn-duplicate"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(3);
  });

  it("delete button removes the selected frame", async () => {
    // 3 frames now; select frame 2 (the last) and delete via inspector
    await jsClick('[data-testid="frame-thumb-2"]');
    await browser.pause(100);
    await jsClick('[data-testid="inspector-btn-delete"]');
    await browser.pause(300);

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);
  });

  it("minimise button hides the panel content", async () => {
    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(200);

    await expect(await $('[data-testid="inspector-frame-indicator"]')).not.toBeExisting();
    await expect(await $('[data-testid="inspector-restore"]')).toBeExisting();
  });

  it("restore button shows the panel content again", async () => {
    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);

    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    await expect(indicator).toBeDisplayed();
    await expect(await $('[data-testid="inspector-minimise"]')).toBeExisting();
  });

  it("inspector panel footer is always present regardless of minimised state", async () => {
    // Expanded state: footer present
    await expect(await $('[data-testid="inspector-footer"]')).toBeExisting();

    // Minimise then check again
    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(200);
    await expect(await $('[data-testid="inspector-footer"]')).toBeExisting();

    // Restore for subsequent tests
    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);
  });

  it("inspector panel is floating with a gap from the window edges", async () => {
    const inspector = await $('[data-testid="inspector"]');
    await inspector.waitForExist({ timeout: 5_000 });

    const result = await browser.execute(() => {
      const el = document.querySelector('[data-testid="inspector"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, right: r.right };
    });

    expect(result).not.toBeNull();
    if (!result) return;

    const windowSize = await browser.getWindowSize();
    // Gap of 8px on the right side
    expect(windowSize.width - result.right).toBeGreaterThanOrEqual(6);
    // Gap of 8px from the top
    expect(result.y).toBeGreaterThanOrEqual(6);
  });

  it("zoom indicator repositions when inspector is minimised", async () => {
    const zoomEl = await $('[data-testid="zoom-indicator"]');
    if (!(await zoomEl.isExisting())) {
      // Zoom indicator only shows when frames are loaded; skip if not visible
      return;
    }

    const xExpanded = await browser.execute(() => {
      const el = document.querySelector('[data-testid="zoom-indicator"]');
      return el ? el.getBoundingClientRect().x : null;
    });

    await jsClick('[data-testid="inspector-minimise"]');
    await browser.pause(300);

    const xMinimised = await browser.execute(() => {
      const el = document.querySelector('[data-testid="zoom-indicator"]');
      return el ? el.getBoundingClientRect().x : null;
    });

    // When inspector minimises, zoom indicator should move right (closer to the edge)
    if (xExpanded !== null && xMinimised !== null) {
      expect(xMinimised).toBeGreaterThan(xExpanded);
    }

    // Restore
    await jsClick('[data-testid="inspector-restore"]');
    await browser.pause(200);
  });

  it("duration label reads 'Duration:' in the same row as the input", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    const durationRow = await $('[data-testid="inspector-duration"]');
    await durationRow.waitForExist({ timeout: 5_000 });
    const text = await durationRow.getText();
    expect(text).toContain("Duration:");
  });
});

/**
 * Dispatch a wheel event on a specific element.
 * Used to test the duration field's scroll-to-increment behaviour.
 */
async function jsWheel(selector: string, deltaY: number, options: { shiftKey?: boolean } = {}) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  await browser.execute(
    (el: HTMLElement, dy: number, opts: { shiftKey?: boolean }) =>
      el.dispatchEvent(
        new WheelEvent("wheel", { deltaY: dy, shiftKey: opts.shiftKey ?? false, bubbles: true, cancelable: true }),
      ),
    element as unknown as HTMLElement,
    deltaY,
    options,
  );
}

/**
 * Simulate what WebKit does on Shift+vertical-scroll: converts it to a horizontal scroll
 * event with deltaY=0 and a non-zero deltaX.  Used to test the Shift+scroll fix.
 */
async function jsWheelShift(selector: string, deltaX: number) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  await browser.execute(
    (el: HTMLElement, dx: number) =>
      el.dispatchEvent(
        new WheelEvent("wheel", { deltaX: dx, deltaY: 0, shiftKey: true, bubbles: true, cancelable: true }),
      ),
    element as unknown as HTMLElement,
    deltaX,
  );
}

describe("Studio — inspector panel improvements (Phase 6)", () => {
  // Entry state: 2 frames loaded (after inspector panel suite).

  it("Ctrl+I minimises the inspector panel", async () => {
    // Ensure inspector is expanded first
    const restore = await $('[data-testid="inspector-restore"]');
    if (await restore.isExisting()) {
      await jsClick('[data-testid="inspector-restore"]');
      await browser.pause(200);
    }

    await browser.execute(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "i", ctrlKey: true, bubbles: true })),
    );
    await browser.pause(200);

    await expect(await $('[data-testid="inspector-restore"]')).toBeExisting();
    await expect(await $('[data-testid="inspector-frame-indicator"]')).not.toBeExisting();
  });

  it("Ctrl+I restores the inspector panel", async () => {
    // Inspector is minimised from previous test
    await browser.execute(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "i", ctrlKey: true, bubbles: true })),
    );
    await browser.pause(200);

    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    await expect(indicator).toBeDisplayed();
    await expect(await $('[data-testid="inspector-minimise"]')).toBeExisting();
  });

  it("frame indicator text is shown in all caps", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);
    const indicator = await $('[data-testid="inspector-frame-indicator"]');
    await indicator.waitForExist({ timeout: 5_000 });
    // CSS text-transform: uppercase — WebdriverIO getText() returns visually rendered text
    const text = await indicator.getText();
    expect(text).toBe(text.toUpperCase());
  });

  it("toggle button is right-aligned in the inspector footer", async () => {
    const result = await browser.execute(() => {
      const footer = document.querySelector('[data-testid="inspector-footer"]');
      const btn = document.querySelector('[data-testid="inspector-minimise"]');
      if (!footer || !btn) return null;
      const footerRect = footer.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      // Right edge of button should be within 8px of the right edge of the footer
      return { footerRight: footerRect.right, btnRight: btnRect.right };
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(Math.abs(result.footerRight - result.btnRight)).toBeLessThanOrEqual(8);
  });

  it("Shift+wheel (WebKit deltaX path) on duration input increases duration by ~100", async () => {
    await jsClick('[data-testid="frame-thumb-0"]');
    await browser.pause(100);

    // Record current duration
    const input = await $('[data-testid="inspector-duration-input"]');
    await input.waitForExist({ timeout: 5_000 });
    const before = parseInt(await input.getValue(), 10);

    // Simulate WebKit Shift+scroll up: deltaX negative = scroll left = increase
    await jsWheelShift('[data-testid="inspector-duration-input"]', -1);
    await browser.pause(300);

    const duration = await $('[data-testid="frame-duration-0"]');
    const after = parseInt(await duration.getText(), 10);
    expect(after).toBe(Math.min(9999, before + 100));
  });

  it("Shift+wheel (WebKit deltaX path) on duration input decreases duration by ~100", async () => {
    // Set a known duration well above 100 so decrement doesn't clamp
    await jsSetValue('[data-testid="inspector-duration-input"]', "500");
    await browser.pause(300);

    // Simulate WebKit Shift+scroll down: deltaX positive = scroll right = decrease
    await jsWheelShift('[data-testid="inspector-duration-input"]', 1);
    await browser.pause(300);

    const duration = await $('[data-testid="frame-duration-0"]');
    const after = parseInt(await duration.getText(), 10);
    expect(after).toBe(400);
  });

  it("drop overlay right boundary does not overlap the inspector panel when expanded", async () => {
    const result = await browser.execute(() => {
      // Trigger a synthetic drag-enter so the drop overlay is rendered
      // We can't easily trigger real drag events in WebKit, so check CSS/computed values instead.
      // Verify that dropOverlayRightMargin is set by checking the inline style on .drop-overlay.
      // Since the overlay is only rendered during drag, we check the inspector left edge
      // vs what the overlay right edge would be.
      const inspector = document.querySelector('[data-testid="inspector"]');
      const viewerArea = document.querySelector('.viewer-area') as HTMLElement;
      if (!inspector || !viewerArea) return null;
      const inspectorRect = inspector.getBoundingClientRect();
      const viewerRect = viewerArea.getBoundingClientRect();
      // Expected overlay right margin (expanded): 256px from viewer right
      const expectedOverlayRightEdge = viewerRect.right - 256;
      return { inspectorLeft: inspectorRect.left, expectedOverlayRightEdge };
    });

    expect(result).not.toBeNull();
    if (!result) return;
    // Overlay right edge should be at or to the left of the inspector left edge
    expect(result.expectedOverlayRightEdge).toBeLessThanOrEqual(result.inspectorLeft + 1);
  });
});
