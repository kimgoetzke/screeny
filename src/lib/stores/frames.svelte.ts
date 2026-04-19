import type { Frame } from "$lib/types";

let frames = $state<Frame[]>([]);
let selectedFrameId = $state<string | null>(null);
let selectedFrameIds = $state<Set<string>>(new Set());
// Tracks the "active end" of a keyboard range selection. The anchor is
// selectedFrameId and stays fixed; selectionActiveId moves with each
// Shift+Arrow press. The selection is always the range [anchor, active].
let selectionActiveId = $state<string | null>(null);
let isPlaying = $state(false);
let playbackTimer: ReturnType<typeof setTimeout> | null = null;
let isLoading = $state(false);
let loadingProgress = $state<number | null>(null);

function scheduleNextFrame() {
  const currentFrame = frames.find((f) => f.id === selectedFrameId);
  if (!currentFrame) return;
  playbackTimer = setTimeout(() => {
    const index = frames.findIndex((f) => f.id === selectedFrameId);
    selectedFrameId = frames[(index + 1) % frames.length].id;
    selectedFrameIds = new Set([selectedFrameId]);
    scheduleNextFrame();
  }, currentFrame.duration);
}

export const frameStore = {
  get frames() {
    return frames;
  },

  get selectedFrameId() {
    return selectedFrameId;
  },

  get selectedFrameIds(): ReadonlySet<string> {
    return selectedFrameIds;
  },

  get selectionActiveId(): string | null {
    return selectionActiveId;
  },

  get selectedFrame(): Frame | undefined {
    return frames.find((f) => f.id === selectedFrameId);
  },

  get hasFrames(): boolean {
    return frames.length > 0;
  },

  get isPlaying(): boolean {
    return isPlaying;
  },

  setFrames(newFrames: Frame[]) {
    frameStore.stop();
    frames = newFrames;
    if (newFrames.length > 0) {
      selectedFrameId = newFrames[0].id;
      selectedFrameIds = new Set([newFrames[0].id]);
      selectionActiveId = newFrames[0].id;
    } else {
      selectedFrameId = null;
      selectedFrameIds = new Set();
      selectionActiveId = null;
    }
  },

  selectFrame(id: string) {
    if (frames.some((f) => f.id === id)) {
      selectedFrameId = id;
      selectedFrameIds = new Set([id]);
      selectionActiveId = id;
    }
  },

  selectNextFrame() {
    if (selectedFrameId === null || frames.length === 0) return;
    const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
    if (currentIndex === -1) return;
    const nextIndex = Math.min(currentIndex + 1, frames.length - 1);
    selectedFrameId = frames[nextIndex].id;
    selectedFrameIds = new Set([selectedFrameId]);
    selectionActiveId = selectedFrameId;
  },

  selectPreviousFrame() {
    if (selectedFrameId === null || frames.length === 0) return;
    const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
    if (currentIndex === -1) return;
    const previousIndex = Math.max(currentIndex - 1, 0);
    selectedFrameId = frames[previousIndex].id;
    selectedFrameIds = new Set([selectedFrameId]);
    selectionActiveId = selectedFrameId;
  },

  extendSelectionRight() {
    if (frames.length === 0 || selectedFrameId === null) return;
    const anchorIndex = frames.findIndex((f) => f.id === selectedFrameId);
    if (anchorIndex === -1) return;
    const currentActiveIndex =
      selectionActiveId !== null
        ? frames.findIndex((f) => f.id === selectionActiveId)
        : anchorIndex;
    const newActiveIndex = Math.min(currentActiveIndex + 1, frames.length - 1);
    selectionActiveId = frames[newActiveIndex].id;
    const start = Math.min(anchorIndex, newActiveIndex);
    const end = Math.max(anchorIndex, newActiveIndex);
    selectedFrameIds = new Set(frames.slice(start, end + 1).map((f) => f.id));
  },

  extendSelectionLeft() {
    if (frames.length === 0 || selectedFrameId === null) return;
    const anchorIndex = frames.findIndex((f) => f.id === selectedFrameId);
    if (anchorIndex === -1) return;
    const currentActiveIndex =
      selectionActiveId !== null
        ? frames.findIndex((f) => f.id === selectionActiveId)
        : anchorIndex;
    const newActiveIndex = Math.max(currentActiveIndex - 1, 0);
    selectionActiveId = frames[newActiveIndex].id;
    const start = Math.min(anchorIndex, newActiveIndex);
    const end = Math.max(anchorIndex, newActiveIndex);
    selectedFrameIds = new Set(frames.slice(start, end + 1).map((f) => f.id));
  },

  togglePlayback() {
    if (isPlaying) {
      frameStore.stop();
    } else {
      frameStore.play();
    }
  },

  selectAllFrames() {
    if (frames.length === 0) return;
    selectedFrameIds = new Set(frames.map((f) => f.id));
    if (selectedFrameId === null) {
      selectedFrameId = frames[0].id;
    }
    selectionActiveId = frames[frames.length - 1].id;
  },

  shiftSelectFrames(id: string) {
    if (selectedFrameId === null) return;
    if (id === selectedFrameId) {
      selectedFrameIds = new Set([selectedFrameId]);
      selectionActiveId = selectedFrameId;
      return;
    }
    const anchorIndex = frames.findIndex((f) => f.id === selectedFrameId);
    const targetIndex = frames.findIndex((f) => f.id === id);
    if (anchorIndex === -1 || targetIndex === -1) return;
    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    selectedFrameIds = new Set(frames.slice(start, end + 1).map((f) => f.id));
    selectionActiveId = id;
  },

  deleteFrame(id: string) {
    const index = frames.findIndex((f) => f.id === id);
    if (index === -1) return;

    frames = frames.filter((f) => f.id !== id);

    // Remove from multi-selection if present
    if (selectedFrameIds.has(id)) {
      const updated = new Set(selectedFrameIds);
      updated.delete(id);
      selectedFrameIds = updated;
    }

    // Adjust single selection
    if (selectedFrameId === id) {
      if (frames.length === 0) {
        selectedFrameId = null;
        selectedFrameIds = new Set();
        selectionActiveId = null;
      } else {
        const newIndex = Math.min(index, frames.length - 1);
        selectedFrameId = frames[newIndex].id;
        selectionActiveId = selectedFrameId;
        // Only reset selectedFrameIds if it's now empty
        if (selectedFrameIds.size === 0) {
          selectedFrameIds = new Set([selectedFrameId]);
        }
      }
    } else if (selectionActiveId === id) {
      // Active end was deleted — reset it to the anchor
      selectionActiveId = selectedFrameId;
    }
  },

  deleteSelectedFrames() {
    if (selectedFrameIds.size === 0) return;

    // Find the lowest index among selected frames to pick the successor
    const selectedSet = selectedFrameIds;
    const firstSelectedIndex = frames.findIndex((f) => selectedSet.has(f.id));

    frames = frames.filter((f) => !selectedSet.has(f.id));

    if (frames.length === 0) {
      selectedFrameId = null;
      selectedFrameIds = new Set();
      selectionActiveId = null;
    } else {
      // Select the frame at the same position as the start of the deleted range,
      // or the last frame if we deleted up to the end
      const newIndex = Math.min(firstSelectedIndex, frames.length - 1);
      selectedFrameId = frames[newIndex].id;
      selectedFrameIds = new Set([selectedFrameId]);
      selectionActiveId = selectedFrameId;
    }
  },

  moveFramesToInsertionPoint(insertionIndex: number) {
    if (selectedFrameIds.size === 0) return;

    const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
    const nonSelected = frames.filter((f) => !selectedFrameIds.has(f.id));

    // Count how many selected frames sit before the insertion slot so we can
    // convert from an "original array" index to a "non-selected array" index.
    const selectedBeforeInsertion = frames
      .slice(0, insertionIndex)
      .filter((f) => selectedFrameIds.has(f.id)).length;

    const adjustedIndex = Math.min(
      Math.max(0, insertionIndex - selectedBeforeInsertion),
      nonSelected.length,
    );

    frames = [
      ...nonSelected.slice(0, adjustedIndex),
      ...selectedInOrder,
      ...nonSelected.slice(adjustedIndex),
    ];
    // selectedFrameIds is intentionally unchanged — moved frames remain selected
  },

  moveSelectedFrames(targetIndex: number) {
    if (selectedFrameIds.size === 0) return;

    const targetFrame = frames[targetIndex];
    if (!targetFrame) return;

    // Dropping onto a selected frame is a no-op
    if (selectedFrameIds.has(targetFrame.id)) return;

    const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
    const nonSelected = frames.filter((f) => !selectedFrameIds.has(f.id));

    const insertAfterIndex = nonSelected.findIndex((f) => f.id === targetFrame.id);

    frames = [
      ...nonSelected.slice(0, insertAfterIndex + 1),
      ...selectedInOrder,
      ...nonSelected.slice(insertAfterIndex + 1),
    ];
    // selectedFrameIds is intentionally left unchanged — moved frames stay selected
  },

  reorderFrames(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      fromIndex >= frames.length ||
      toIndex < 0 ||
      toIndex >= frames.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const updated = [...frames];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    frames = updated;
  },

  play() {
    if (!frames.length || isPlaying) return;
    isPlaying = true;
    scheduleNextFrame();
  },

  stop() {
    if (playbackTimer !== null) {
      clearTimeout(playbackTimer);
      playbackTimer = null;
    }
    isPlaying = false;
  },

  clear() {
    frameStore.stop();
    frames = [];
    selectedFrameId = null;
    selectedFrameIds = new Set();
    selectionActiveId = null;
    isLoading = false;
    loadingProgress = null;
  },

  deduplicateAdjacentMerge() {
    if (selectedFrameIds.size > 1) {
      const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
      const dedupedSelection: Frame[] = [];
      for (const frame of selectedInOrder) {
        const previous = dedupedSelection[dedupedSelection.length - 1];
        if (previous && previous.imageData === frame.imageData) {
          dedupedSelection[dedupedSelection.length - 1] = {
            ...previous,
            duration: previous.duration + frame.duration,
          };
        } else {
          dedupedSelection.push(frame);
        }
      }
      let emittedSelection = false;
      const result: Frame[] = [];
      for (const frame of frames) {
        if (selectedFrameIds.has(frame.id)) {
          if (!emittedSelection) {
            result.push(...dedupedSelection);
            emittedSelection = true;
          }
        } else {
          result.push(frame);
        }
      }
      frames = result;
      const survivingSelectedIds = new Set(dedupedSelection.map((f) => f.id));
      selectedFrameIds = survivingSelectedIds;
      if (!survivingSelectedIds.has(selectedFrameId!)) {
        selectedFrameId = dedupedSelection.length > 0 ? dedupedSelection[0].id : null;
      }
    } else {
      const result: Frame[] = [];
      for (const frame of frames) {
        const previous = result[result.length - 1];
        if (previous && previous.imageData === frame.imageData) {
          result[result.length - 1] = { ...previous, duration: previous.duration + frame.duration };
        } else {
          result.push(frame);
        }
      }
      frames = result;
      if (!result.some((f) => f.id === selectedFrameId)) {
        selectedFrameId = result.length > 0 ? result[0].id : null;
        selectedFrameIds = selectedFrameId ? new Set([selectedFrameId]) : new Set();
      }
    }
  },

  deduplicateAdjacentDrop() {
    if (selectedFrameIds.size > 1) {
      const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
      const dedupedSelection: Frame[] = [];
      for (const frame of selectedInOrder) {
        const previous = dedupedSelection[dedupedSelection.length - 1];
        if (!previous || previous.imageData !== frame.imageData) {
          dedupedSelection.push(frame);
        }
      }
      let emittedSelection = false;
      const result: Frame[] = [];
      for (const frame of frames) {
        if (selectedFrameIds.has(frame.id)) {
          if (!emittedSelection) {
            result.push(...dedupedSelection);
            emittedSelection = true;
          }
        } else {
          result.push(frame);
        }
      }
      frames = result;
      const survivingSelectedIds = new Set(dedupedSelection.map((f) => f.id));
      selectedFrameIds = survivingSelectedIds;
      if (!survivingSelectedIds.has(selectedFrameId!)) {
        selectedFrameId = dedupedSelection.length > 0 ? dedupedSelection[0].id : null;
      }
    } else {
      const result: Frame[] = [];
      for (const frame of frames) {
        const previous = result[result.length - 1];
        if (!previous || previous.imageData !== frame.imageData) {
          result.push(frame);
        }
      }
      frames = result;
      if (!result.some((f) => f.id === selectedFrameId)) {
        selectedFrameId = result.length > 0 ? result[0].id : null;
        selectedFrameIds = selectedFrameId ? new Set([selectedFrameId]) : new Set();
      }
    }
  },

  duplicateSelectedFrames() {
    if (selectedFrameIds.size === 0) return;

    // Collect selected frames in their current array order
    const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));

    // Find the index of the last selected frame (insertion point)
    const lastSelectedIndex = frames.reduce(
      (max, f, i) => (selectedFrameIds.has(f.id) ? i : max),
      -1,
    );

    const duplicates: Frame[] = selectedInOrder.map((f) => ({
      ...f,
      id: crypto.randomUUID(),
    }));

    frames = [
      ...frames.slice(0, lastSelectedIndex + 1),
      ...duplicates,
      ...frames.slice(lastSelectedIndex + 1),
    ];

    // Select the newly inserted duplicates
    const duplicateIds = new Set(duplicates.map((f) => f.id));
    selectedFrameIds = duplicateIds;
    selectedFrameId = duplicates[0].id;
    selectionActiveId = duplicates[duplicates.length - 1].id;
  },

  setFrameDuration(duration: number) {
    if (selectedFrameIds.size === 0) return;
    const clamped = Math.min(Math.max(1, duration), 9999);
    frames = frames.map((f) =>
      selectedFrameIds.has(f.id) ? { ...f, duration: clamped } : f,
    );
  },

  addFrame(frame: Frame) {
    frames = [...frames, frame];
    if (frames.length === 1) {
      selectedFrameId = frame.id;
      selectedFrameIds = new Set([frame.id]);
    }
  },

  get isLoading(): boolean {
    return isLoading;
  },

  get loadingProgress(): number | null {
    return loadingProgress;
  },

  startLoading() {
    frameStore.stop();
    frames = [];
    selectedFrameId = null;
    selectedFrameIds = new Set();
    selectionActiveId = null;
    isLoading = true;
    loadingProgress = 0;
  },

  finishLoading() {
    isLoading = false;
    loadingProgress = null;
  },

  setLoadingProgress(percentage: number) {
    loadingProgress = percentage;
  },
};
