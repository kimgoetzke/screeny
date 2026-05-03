import type { Frame } from "$lib/types";

export interface SelectionState {
  selectedFrameId: string | null;
  selectedFrameIds: ReadonlySet<string>;
  selectionActiveId: string | null;
}

export function selectFrame(frames: Frame[], state: SelectionState, id: string): SelectionState {
  if (!frames.some((f) => f.id === id)) return state;
  return { selectedFrameId: id, selectedFrameIds: new Set([id]), selectionActiveId: id };
}

export function selectNextFrame(frames: Frame[], state: SelectionState): SelectionState {
  if (state.selectedFrameId === null || frames.length === 0) return state;
  const currentIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  if (currentIndex === -1) return state;
  const id = frames[Math.min(currentIndex + 1, frames.length - 1)].id;
  return { selectedFrameId: id, selectedFrameIds: new Set([id]), selectionActiveId: id };
}

export function selectPreviousFrame(frames: Frame[], state: SelectionState): SelectionState {
  if (state.selectedFrameId === null || frames.length === 0) return state;
  const currentIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  if (currentIndex === -1) return state;
  const id = frames[Math.max(currentIndex - 1, 0)].id;
  return { selectedFrameId: id, selectedFrameIds: new Set([id]), selectionActiveId: id };
}

export function selectFirstFrame(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0) return state;
  const id = frames[0].id;
  return { selectedFrameId: id, selectedFrameIds: new Set([id]), selectionActiveId: id };
}

export function selectLastFrame(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0) return state;
  const id = frames[frames.length - 1].id;
  return { selectedFrameId: id, selectedFrameIds: new Set([id]), selectionActiveId: id };
}

export function selectToFirstFrame(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0 || state.selectedFrameId === null) return state;
  const anchorIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  if (anchorIndex === -1) return state;
  return {
    selectedFrameId: state.selectedFrameId,
    selectionActiveId: frames[0].id,
    selectedFrameIds: new Set(frames.slice(0, anchorIndex + 1).map((f) => f.id)),
  };
}

export function selectToLastFrame(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0 || state.selectedFrameId === null) return state;
  const anchorIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  if (anchorIndex === -1) return state;
  return {
    selectedFrameId: state.selectedFrameId,
    selectionActiveId: frames[frames.length - 1].id,
    selectedFrameIds: new Set(frames.slice(anchorIndex).map((f) => f.id)),
  };
}

export function extendSelectionRight(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0 || state.selectedFrameId === null) return state;
  const anchorIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  if (anchorIndex === -1) return state;
  const currentActiveIndex =
    state.selectionActiveId !== null
      ? frames.findIndex((f) => f.id === state.selectionActiveId)
      : anchorIndex;
  const newActiveIndex = Math.min(currentActiveIndex + 1, frames.length - 1);
  const newActiveId = frames[newActiveIndex].id;
  const start = Math.min(anchorIndex, newActiveIndex);
  const end = Math.max(anchorIndex, newActiveIndex);
  return {
    selectedFrameId: state.selectedFrameId,
    selectionActiveId: newActiveId,
    selectedFrameIds: new Set(frames.slice(start, end + 1).map((f) => f.id)),
  };
}

export function extendSelectionLeft(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0 || state.selectedFrameId === null) return state;
  const anchorIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  if (anchorIndex === -1) return state;
  const currentActiveIndex =
    state.selectionActiveId !== null
      ? frames.findIndex((f) => f.id === state.selectionActiveId)
      : anchorIndex;
  const newActiveIndex = Math.max(currentActiveIndex - 1, 0);
  const newActiveId = frames[newActiveIndex].id;
  const start = Math.min(anchorIndex, newActiveIndex);
  const end = Math.max(anchorIndex, newActiveIndex);
  return {
    selectedFrameId: state.selectedFrameId,
    selectionActiveId: newActiveId,
    selectedFrameIds: new Set(frames.slice(start, end + 1).map((f) => f.id)),
  };
}

export function selectAllFrames(frames: Frame[], state: SelectionState): SelectionState {
  if (frames.length === 0) return state;
  return {
    selectedFrameId: state.selectedFrameId ?? frames[0].id,
    selectedFrameIds: new Set(frames.map((f) => f.id)),
    selectionActiveId: frames[frames.length - 1].id,
  };
}

export function shiftSelectFrames(
  frames: Frame[],
  state: SelectionState,
  id: string,
): SelectionState {
  if (state.selectedFrameId === null) return state;
  if (id === state.selectedFrameId) {
    return {
      selectedFrameId: state.selectedFrameId,
      selectedFrameIds: new Set([state.selectedFrameId]),
      selectionActiveId: state.selectedFrameId,
    };
  }
  const anchorIndex = frames.findIndex((f) => f.id === state.selectedFrameId);
  const targetIndex = frames.findIndex((f) => f.id === id);
  if (anchorIndex === -1 || targetIndex === -1) return state;
  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return {
    selectedFrameId: state.selectedFrameId,
    selectedFrameIds: new Set(frames.slice(start, end + 1).map((f) => f.id)),
    selectionActiveId: id,
  };
}
