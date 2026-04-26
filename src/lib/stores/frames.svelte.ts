import type { Frame } from "$lib/types";
import * as sel from "$lib/frameSelection";
import type { SelectionState } from "$lib/frameSelection";
import * as edit from "$lib/frameEditing";

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
let loadingFrameCount = $state(0);
let loadingTotalFrames = $state<number | null>(null);
let loadSessionId = $state(0);

function getSelection(): SelectionState {
  return { selectedFrameId, selectedFrameIds, selectionActiveId };
}

function applySelection(state: SelectionState): void {
  selectedFrameId = state.selectedFrameId;
  selectedFrameIds = state.selectedFrameIds as Set<string>;
  selectionActiveId = state.selectionActiveId;
}

function applyEdit(result: edit.FrameEditResult): void {
  frames = result.frames;
  applySelection(result.selection);
}

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
    applySelection(sel.selectFrame(frames, getSelection(), id));
  },

  selectNextFrame() {
    applySelection(sel.selectNextFrame(frames, getSelection()));
  },

  selectPreviousFrame() {
    applySelection(sel.selectPreviousFrame(frames, getSelection()));
  },

  selectFirstFrame() {
    applySelection(sel.selectFirstFrame(frames, getSelection()));
  },

  selectLastFrame() {
    applySelection(sel.selectLastFrame(frames, getSelection()));
  },

  selectToFirstFrame() {
    applySelection(sel.selectToFirstFrame(frames, getSelection()));
  },

  selectToLastFrame() {
    applySelection(sel.selectToLastFrame(frames, getSelection()));
  },

  extendSelectionRight() {
    applySelection(sel.extendSelectionRight(frames, getSelection()));
  },

  extendSelectionLeft() {
    applySelection(sel.extendSelectionLeft(frames, getSelection()));
  },

  selectAllFrames() {
    applySelection(sel.selectAllFrames(frames, getSelection()));
  },

  shiftSelectFrames(id: string) {
    applySelection(sel.shiftSelectFrames(frames, getSelection(), id));
  },

  deleteFrame(id: string) {
    applyEdit(edit.deleteFrame(frames, getSelection(), id));
  },

  deleteSelectedFrames() {
    applyEdit(edit.deleteSelectedFrames(frames, getSelection()));
  },

  moveFramesToInsertionPoint(insertionIndex: number) {
    applyEdit(edit.moveFramesToInsertionPoint(frames, getSelection(), insertionIndex));
  },

  moveSelectedFramesToStart() {
    applyEdit(edit.moveSelectedFramesToStart(frames, getSelection()));
  },

  moveSelectedFrameLeft() {
    applyEdit(edit.moveSelectedFrameLeft(frames, getSelection()));
  },

  moveSelectedFrameRight() {
    applyEdit(edit.moveSelectedFrameRight(frames, getSelection()));
  },

  moveSelectedFramesToEnd() {
    applyEdit(edit.moveSelectedFramesToEnd(frames, getSelection()));
  },

  moveSelectedFrames(targetIndex: number) {
    applyEdit(edit.moveSelectedFrames(frames, getSelection(), targetIndex));
  },

  reorderFrames(fromIndex: number, toIndex: number) {
    applyEdit(edit.reorderFrames(frames, getSelection(), fromIndex, toIndex));
  },

  togglePlayback() {
    if (isPlaying) {
      frameStore.stop();
    } else {
      frameStore.play();
    }
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
    loadingFrameCount = 0;
    loadingTotalFrames = null;
  },

  deduplicateAdjacentMerge() {
    applyEdit(edit.deduplicateAdjacentMerge(frames, getSelection()));
  },

  deduplicateAdjacentDrop() {
    applyEdit(edit.deduplicateAdjacentDrop(frames, getSelection()));
  },

  duplicateSelectedFrames() {
    applyEdit(edit.duplicateSelectedFrames(frames, getSelection()));
  },

  setFrameDuration(duration: number) {
    applyEdit(edit.setFrameDuration(frames, getSelection(), duration));
  },

  addFrame(frame: Frame) {
    const wasEmpty = frames.length === 0;
    frames.push(frame);
    if (isLoading) {
      loadingFrameCount = frames.length;
    }
    if (wasEmpty) {
      selectedFrameId = frame.id;
      selectedFrameIds = new Set([frame.id]);
    }
  },

  addFrames(newFrames: Frame[]) {
    if (newFrames.length === 0) return;
    const wasEmpty = frames.length === 0;
    frames.push(...newFrames);
    if (isLoading) {
      loadingFrameCount = frames.length;
    }
    if (wasEmpty) {
      selectedFrameId = newFrames[0].id;
      selectedFrameIds = new Set([newFrames[0].id]);
    }
  },

  get isLoading(): boolean {
    return isLoading;
  },

  get loadingProgress(): number | null {
    return loadingProgress;
  },

  get loadingFrameCount(): number {
    return loadingFrameCount;
  },

  get loadingTotalFrames(): number | null {
    return loadingTotalFrames;
  },

  get loadSessionId(): number {
    return loadSessionId;
  },

  startLoading() {
    frameStore.stop();
    frames = [];
    selectedFrameId = null;
    selectedFrameIds = new Set();
    selectionActiveId = null;
    isLoading = true;
    loadingProgress = 0;
    loadingFrameCount = 0;
    loadingTotalFrames = null;
    loadSessionId += 1;
  },

  finishLoading() {
    isLoading = false;
    loadingProgress = null;
    loadingFrameCount = 0;
    loadingTotalFrames = null;
  },

  cancelLoad() {
    frameStore.stop();
    frames = [];
    selectedFrameId = null;
    selectedFrameIds = new Set();
    selectionActiveId = null;
    isLoading = false;
    loadingProgress = null;
    loadingFrameCount = 0;
    loadingTotalFrames = null;
    loadSessionId += 1;
  },

  setLoadingProgress(percentage: number) {
    loadingProgress = percentage;
  },

  setLoadingTotalFrames(totalFrames: number) {
    loadingTotalFrames = totalFrames;
    loadingFrameCount = 0;
  },
};
