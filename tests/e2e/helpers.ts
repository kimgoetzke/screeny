import { $, browser, expect } from "@wdio/globals";

/** Dispatch a window-level keydown event, as if the user pressed a key. */
export async function dispatchKey(
  key: string,
  options: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean } = {},
) {
  await browser.execute(
    (k: string, opts: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean }) =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...opts })),
    key,
    options,
  );
}

export async function getFrameOrder() {
  return browser.execute(() =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="frame-thumb-"]')).map(
      (element) => element.dataset.frameId ?? "",
    ),
  );
}

export async function focusElement(selector: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  await browser.execute((el: HTMLElement) => el.focus(), element as unknown as HTMLElement);
}

export async function getActiveTestId() {
  return browser.execute(() => {
    if (!(document.activeElement instanceof HTMLElement)) {
      return null;
    }
    return document.activeElement.getAttribute("data-testid");
  });
}

/** Dispatch a Ctrl+wheel event on the project canvas to trigger cursor-centred zoom. */
export async function ctrlWheel(deltaY: number) {
  await browser.execute((dy: number) => {
    const projectCanvas = document.querySelector('[data-testid="project-canvas"]')!;
    projectCanvas.dispatchEvent(
      new WheelEvent("wheel", { deltaY: dy, ctrlKey: true, bubbles: true, cancelable: true }),
    );
  }, deltaY);
}

/** Click an element via JavaScript to bypass WebKitWebDriver interactability checks. */
export async function jsClick(selector: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 10_000 });
  await browser.execute((el: HTMLElement) => el.click(), element as unknown as HTMLElement);
}

/**
 * Shift+click an element via JavaScript, dispatching a MouseEvent with shiftKey=true.
 * Used for range-selection in the timeline.
 */
export async function jsShiftClick(selector: string) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 10_000 });
  await browser.execute(
    (el: HTMLElement) =>
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true })),
    element as unknown as HTMLElement,
  );
}

/**
 * Simulate a pointer-based drag from one element to the right-hand side of another.
 * The Timeline uses pointer events (not HTML5 DnD) so we dispatch PointerEvents directly:
 *   pointerdown on source → pointermove (cross threshold) → pointermove (over target) → pointerup
 * Dropping near the right edge of the target places the insertion slot AFTER that frame.
 */
export async function jsDrag(fromSelector: string, toSelector: string) {
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

      from.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX: startX,
          clientY: startY,
          button: 0,
        }),
      );
      // First move must exceed the 5 px threshold to commit the drag
      window.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, clientX: startX + 10, clientY: startY }),
      );
      window.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, clientX: endX, clientY: endY }),
      );
      window.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, clientX: endX, clientY: endY }),
      );
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
export async function jsSetValue(selector: string, value: string) {
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
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return browser.execute(
    async (cmd: string, cmdArgs: unknown) => {
      return (window as any).__TAURI_INTERNALS__.invoke(cmd, cmdArgs) as Promise<T>;
    },
    command,
    args ?? {},
  ) as Promise<T>;
}

/** Dispatch a wheel event on a specific element. */
export async function jsWheel(
  selector: string,
  deltaY: number,
  options: { shiftKey?: boolean } = {},
) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  await browser.execute(
    (el: HTMLElement, dy: number, opts: { shiftKey?: boolean }) =>
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: dy,
          shiftKey: opts.shiftKey ?? false,
          bubbles: true,
          cancelable: true,
        }),
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
export async function jsWheelShift(selector: string, deltaX: number) {
  const element = await $(selector);
  await element.waitForExist({ timeout: 5_000 });
  await browser.execute(
    (el: HTMLElement, dx: number) =>
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaX: dx,
          deltaY: 0,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    element as unknown as HTMLElement,
    deltaX,
  );
}

/** Ensure the app is in the Empty Project State (btn-open visible, no frames loaded). */
export async function resetToEmpty() {
  // Dismiss any open confirmation dialog first
  const dialog = await $('[data-testid="dialog"]');
  if (await dialog.isExisting()) {
    await jsClick('[data-testid="btn-dialog-cancel"]');
    await browser.pause(200);
  }

  // Close active project if one is loaded
  const closeBtn = await $('[data-testid="btn-close"]');
  if (await closeBtn.isExisting()) {
    await jsClick('[data-testid="btn-close"]');
    const confirmDialog = await $('[data-testid="dialog"]');
    await confirmDialog.waitForExist({ timeout: 5_000 });
    await jsClick('[data-testid="btn-dialog-confirm"]');
  }

  const openButton = await $('[data-testid="btn-open"]');
  await openButton.waitForExist({ timeout: 10_000 });
}

export async function loadFixture(fileName: string, expectedFrameCount: number) {
  await resetToEmpty();

  await jsClick('[data-testid="btn-open"]');

  const filePicker = await $('[data-testid="file-picker"]');
  await filePicker.waitForExist({ timeout: 5_000 });

  const fixtureDir = await tauriInvoke<string>("e2e_fixture_dir");
  await jsSetValue('[data-testid="file-picker-navigate"]', fixtureDir);
  await jsClick('[data-testid="file-picker-go"]');

  const fixtureEntry = await $(`[data-testid="file-picker-entry-${fileName}"]`);
  await fixtureEntry.waitForExist({ timeout: 5_000 });
  await jsClick(`[data-testid="file-picker-entry-${fileName}"]`);
  await jsClick('[data-testid="file-picker-confirm"]');

  const status = await $('[data-testid="status-message"]');
  await status.waitForExist({ timeout: 10_000 });
  await expect(status).toHaveText(`Loaded ${expectedFrameCount} frames`);

  const canvas = await $('[data-testid="frame-canvas"]');
  await canvas.waitForExist({ timeout: 5_000 });
}

export async function getSelectedThumbId(): Promise<string | null> {
  return browser.execute(() => {
    const selectedThumb = document.querySelector<HTMLElement>(
      '[data-testid^="frame-thumb-"].selected',
    );
    return selectedThumb?.dataset.testid ?? null;
  });
}

export async function resetPlaybackState() {
  const stopButton = await $('[data-testid="btn-stop"]');
  if (await stopButton.isEnabled()) {
    await jsClick('[data-testid="btn-stop"]');
    await expect(await $('[data-testid="btn-play"]')).not.toBeDisabled();
    await expect(stopButton).toBeDisabled();
  }

  await jsClick('[data-testid="frame-thumb-0"]');
  expect(await getSelectedThumbId()).toBe("frame-thumb-0");
}

export async function getLoadedGifFitMetrics() {
  return browser.execute(() => {
    const projectCanvas = document.querySelector('[data-testid="project-canvas"]');
    const canvas = document.querySelector('[data-testid="frame-canvas"]');
    const inspector = document.querySelector('[data-testid="inspector"]');

    if (!(projectCanvas instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
      return null;
    }

    const canvasSurfaceRect = projectCanvas.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const inspectorRect =
      inspector instanceof HTMLElement ? inspector.getBoundingClientRect() : null;
    const visibleRightEdge = inspectorRect ? inspectorRect.left : canvasSurfaceRect.right;
    const visibleWidth = visibleRightEdge - canvasSurfaceRect.left;
    const visibleHeight = canvasSurfaceRect.height;
    const visibleCentreX = canvasSurfaceRect.left + visibleWidth / 2;
    const visibleCentreY = canvasSurfaceRect.top + visibleHeight / 2;
    const canvasCentreX = canvasRect.left + canvasRect.width / 2;
    const canvasCentreY = canvasRect.top + canvasRect.height / 2;

    return {
      canvasWidth: canvasRect.width,
      canvasHeight: canvasRect.height,
      visibleWidth,
      visibleHeight,
      widthRatio: canvasRect.width / visibleWidth,
      heightRatio: canvasRect.height / visibleHeight,
      deltaX: canvasCentreX - visibleCentreX,
      deltaY: canvasCentreY - visibleCentreY,
    };
  });
}

export async function waitForZoomReset() {
  await browser.waitUntil(async () => (await $('[data-testid="zoom-reset"]')).isExisting(), {
    timeout: 5_000,
    timeoutMsg: "expected reset zoom control to appear",
  });
}

export async function getEmptyViewerAlignment() {
  return browser.execute(() => {
    const projectCanvas = document.querySelector('[data-testid="project-canvas"]');
    const empty = document.querySelector('[data-testid="canvas-empty"]');
    if (!(projectCanvas instanceof HTMLElement) || !(empty instanceof HTMLElement)) {
      return null;
    }

    const canvasRect = projectCanvas.getBoundingClientRect();
    const emptyRect = empty.getBoundingClientRect();
    const canvasCentreX = canvasRect.left + canvasRect.width / 2;
    const emptyCentreX = emptyRect.left + emptyRect.width / 2;

    return {
      canvasCentreX,
      emptyCentreX,
      deltaX: emptyCentreX - canvasCentreX,
    };
  });
}

export async function waitForFrameCount(expected: number, message?: string) {
  await browser.waitUntil(
    async () => {
      const count: number = await browser.execute(
        () => document.querySelectorAll('[data-testid^="frame-thumb-"]').length,
      );
      return count === expected;
    },
    { timeout: 5_000, timeoutMsg: message ?? `expected ${expected} frame(s)` },
  );
}

export async function getToolbarPlaybackAlignment() {
  return browser.execute(() => {
    const toolbar = document.querySelector('[data-testid="toolbar"]');
    const play = document.querySelector('[data-testid="btn-play"]');
    const stop = document.querySelector('[data-testid="btn-stop"]');

    if (
      !(toolbar instanceof HTMLElement) ||
      !(play instanceof HTMLElement) ||
      !(stop instanceof HTMLElement)
    ) {
      return null;
    }

    const toolbarRect = toolbar.getBoundingClientRect();
    const playRect = play.getBoundingClientRect();
    const stopRect = stop.getBoundingClientRect();

    const toolbarCentreX = toolbarRect.left + toolbarRect.width / 2;
    const playbackCentreX = playRect.left + (stopRect.right - playRect.left) / 2;

    return {
      toolbarCentreX,
      playbackCentreX,
      deltaX: playbackCentreX - toolbarCentreX,
    };
  });
}
