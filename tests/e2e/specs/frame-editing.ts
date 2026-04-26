import { $, $$, browser, expect } from "@wdio/globals";
import {
  jsClick,
  jsShiftClick,
  jsDrag,
  dispatchKey,
  loadFixture,
  waitForFrameCount,
} from "../helpers.js";

describe("Studio — frame selection", () => {
  before(async () => {
    await loadFixture("test.gif", 3);
  });

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
  before(async () => {
    await loadFixture("test.gif", 3);
  });

  it("should delete a frame and update the timeline", async () => {
    // We have 3 frames; delete the last one
    await jsClick('[data-testid="frame-delete-2"]');

    await waitForFrameCount(2, "expected 2 frames after deleting frame 2");

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);
  });
});

describe("Studio — bulk delete frames", () => {
  it("should reload the GIF fixture for bulk delete tests", async () => {
    await loadFixture("test.gif", 3);
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
    await waitForFrameCount(2, "expected 2 frames after single-frame delete");

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);
  });

  it("should bulk-delete all selected frames when clicking delete on a selected frame", async () => {
    // Both remaining frames are still selected from the previous test
    await jsClick('[data-testid="frame-delete-0"]');
    await waitForFrameCount(0, "expected 0 frames after bulk delete");

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(0);
  });
});

describe("Studio — deduplicate frames", () => {
  it("should load the dedup fixture (3 frames: red, red, blue)", async () => {
    await loadFixture("dedup.gif", 3);
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
    await waitForFrameCount(2, "expected 2 frames after dedup drop");

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("100ms");
  });

  it("should close the project and reload the dedup fixture for the merge test", async () => {
    await loadFixture("dedup.gif", 3);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("merge: removes adjacent duplicate and adds its duration to the kept frame", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-merge"]');
    await waitForFrameCount(2, "expected 2 frames after dedup merge");

    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("300ms");
  });
});

describe("Studio — drag to reorder frames", () => {
  it("should reload the GIF fixture for single-frame drag tests", async () => {
    await loadFixture("test.gif", 3);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
  });

  it("should reorder a single unselected frame forward by drag-and-drop", async () => {
    // Frame 0 is selected by default after load; click frame 1 to select only frame 1,
    // then drag frame 0 (now unselected) → exercises the single-frame reorderFrames path.
    await jsClick('[data-testid="frame-thumb-1"]');
    await browser.pause(100);

    const idAt0Before = await (
      await $('[data-testid="frame-thumb-0"]')
    ).getAttribute("data-frame-id");

    // Drag frame 0 onto frame 2 — reorderFrames(0, 2) → frame 0 ends up at position 2.
    await jsDrag('[data-testid="frame-thumb-0"]', '[data-testid="frame-thumb-2"]');
    await browser.pause(300);

    const idAt0After = await (
      await $('[data-testid="frame-thumb-0"]')
    ).getAttribute("data-frame-id");
    const idAt2After = await (
      await $('[data-testid="frame-thumb-2"]')
    ).getAttribute("data-frame-id");

    expect(idAt0After).not.toBe(idAt0Before); // frame originally at 0 has moved
    expect(idAt2After).toBe(idAt0Before); // it is now at position 2
  });

  it("should reload the fixture for multi-frame drag tests", async () => {
    await loadFixture("test.gif", 3);
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

describe("Studio — inspector move-frame buttons", () => {
  let firstFrameId: string | null = null;
  let secondFrameId: string | null = null;
  let thirdFrameId: string | null = null;

  it("should reload the GIF fixture for inspector move-button tests", async () => {
    await loadFixture("test.gif", 3);
    const firstThumb = await $('[data-testid="frame-thumb-0"]');
    await firstThumb.waitForExist({ timeout: 10_000 });

    firstFrameId = await firstThumb.getAttribute("data-frame-id");
    secondFrameId = await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id");
    thirdFrameId = await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id");

    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(3);
    expect(await firstThumb.getAttribute("class")).toContain("selected");
  });

  it("move-to-end sends the selected frame to the last position", async () => {
    await jsClick('[data-testid="inspector-btn-move-end"]');
    await browser.pause(300);

    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id")).toBe(
      secondFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id")).toBe(
      thirdFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id")).toBe(
      firstFrameId,
    );
  });

  it("move-to-start returns the selected frame to the first position", async () => {
    await jsClick('[data-testid="inspector-btn-move-start"]');
    await browser.pause(300);

    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id")).toBe(
      firstFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id")).toBe(
      secondFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id")).toBe(
      thirdFrameId,
    );
  });

  it("step-right moves the selected frame one position right", async () => {
    await jsClick('[data-testid="inspector-btn-move-right"]');
    await browser.pause(300);

    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id")).toBe(
      secondFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id")).toBe(
      firstFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id")).toBe(
      thirdFrameId,
    );
  });

  it("step-left moves the selected frame one position left", async () => {
    await jsClick('[data-testid="inspector-btn-move-left"]');
    await browser.pause(300);

    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id")).toBe(
      firstFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id")).toBe(
      secondFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id")).toBe(
      thirdFrameId,
    );
  });

  it("move-to-end keeps a multi-selection together at the end", async () => {
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    await jsClick('[data-testid="inspector-btn-move-end"]');
    await browser.pause(300);

    expect(await (await $('[data-testid="frame-thumb-0"]')).getAttribute("data-frame-id")).toBe(
      thirdFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-1"]')).getAttribute("data-frame-id")).toBe(
      firstFrameId,
    );
    expect(await (await $('[data-testid="frame-thumb-2"]')).getAttribute("data-frame-id")).toBe(
      secondFrameId,
    );
  });
});

describe("Studio — deduplicate frames (selection-scoped)", () => {
  it("should load the dedup-selection fixture (4 frames)", async () => {
    await loadFixture("dedup-selection.gif", 4);
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(4);
  });

  it("merge (selection-scoped): merges only the selected duplicate frames; non-selected frames unchanged", async () => {
    // Frame 0 is selected by default (anchor); shift+click frame 1 → selects frames 0–1 (both red)
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-merge"]');
    await waitForFrameCount(3, "expected 3 frames after selection-scoped merge");

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
    await loadFixture("dedup-selection.gif", 4);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(4);
  });

  it("drop (selection-scoped): drops only the selected duplicate frame; non-selected frames unchanged", async () => {
    // Frame 0 is selected (anchor); shift+click frame 1 → selects frames 0–1
    await jsShiftClick('[data-testid="frame-thumb-1"]');
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-drop"]');
    await waitForFrameCount(3, "expected 3 frames after selection-scoped drop");

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
    await loadFixture("dedup-selection.gif", 4);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(4);
  });

  it("merge (all-selected): deduplicates the full GIF when all frames are selected", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-merge"]');
    await waitForFrameCount(2, "expected 2 frames after all-selected merge");

    // 2 frames remain: [red(300ms), blue(250ms)]
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("300ms");

    const duration1 = await $('[data-testid="frame-duration-1"]');
    await expect(duration1).toHaveText("250ms");
  });

  it("should reload the dedup-selection fixture for the single-select drop test", async () => {
    await loadFixture("dedup-selection.gif", 4);
    expect(await $$('[data-testid^="frame-thumb-"]')).toHaveLength(4);
  });

  it("drop (all-selected): deduplicates the full GIF when all frames are selected", async () => {
    await dispatchKey("a", { ctrlKey: true });
    await browser.pause(200);

    await jsClick('[data-testid="inspector-dedup-drop"]');
    await waitForFrameCount(2, "expected 2 frames after all-selected drop");

    // 2 frames remain: [red(100ms), blue(100ms)]
    const thumbs = await $$('[data-testid^="frame-thumb-"]');
    expect(thumbs).toHaveLength(2);

    const duration0 = await $('[data-testid="frame-duration-0"]');
    await expect(duration0).toHaveText("100ms");

    const duration1 = await $('[data-testid="frame-duration-1"]');
    await expect(duration1).toHaveText("100ms");
  });
});
