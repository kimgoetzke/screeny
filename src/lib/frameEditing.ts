import type { Frame } from "$lib/types";
import type { SelectionState } from "$lib/frameSelection";

export interface FrameEditResult {
  frames: Frame[];
  selection: SelectionState;
}

export function deleteFrame(
  frames: Frame[],
  selection: SelectionState,
  id: string,
): FrameEditResult {
  const index = frames.findIndex((f) => f.id === id);
  if (index === -1) return { frames, selection };

  const newFrames = frames.filter((f) => f.id !== id);
  let { selectedFrameId, selectedFrameIds, selectionActiveId } = selection;

  if (selectedFrameIds.has(id)) {
    const updated = new Set(selectedFrameIds);
    updated.delete(id);
    selectedFrameIds = updated;
  }

  if (selectedFrameId === id) {
    if (newFrames.length === 0) {
      selectedFrameId = null;
      selectedFrameIds = new Set();
      selectionActiveId = null;
    } else {
      const newIndex = Math.min(index, newFrames.length - 1);
      selectedFrameId = newFrames[newIndex].id;
      selectionActiveId = selectedFrameId;
      if (selectedFrameIds.size === 0) {
        selectedFrameIds = new Set([selectedFrameId]);
      }
    }
  } else if (selectionActiveId === id) {
    selectionActiveId = selectedFrameId;
  }

  return {
    frames: newFrames,
    selection: { selectedFrameId, selectedFrameIds, selectionActiveId },
  };
}

export function deleteSelectedFrames(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  const { selectedFrameIds } = selection;
  if (selectedFrameIds.size === 0) return { frames, selection };

  const firstSelectedIndex = frames.findIndex((f) => selectedFrameIds.has(f.id));
  const newFrames = frames.filter((f) => !selectedFrameIds.has(f.id));

  if (newFrames.length === 0) {
    return {
      frames: newFrames,
      selection: { selectedFrameId: null, selectedFrameIds: new Set(), selectionActiveId: null },
    };
  }

  const newIndex = Math.min(firstSelectedIndex, newFrames.length - 1);
  const selectedFrameId = newFrames[newIndex].id;
  return {
    frames: newFrames,
    selection: {
      selectedFrameId,
      selectedFrameIds: new Set([selectedFrameId]),
      selectionActiveId: selectedFrameId,
    },
  };
}

export function duplicateSelectedFrames(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  const { selectedFrameIds } = selection;
  if (selectedFrameIds.size === 0) return { frames, selection };

  const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
  const lastSelectedIndex = frames.reduce(
    (max, f, i) => (selectedFrameIds.has(f.id) ? i : max),
    -1,
  );

  const duplicates: Frame[] = selectedInOrder.map((f) => ({
    ...f,
    id: crypto.randomUUID(),
  }));

  const newFrames = [
    ...frames.slice(0, lastSelectedIndex + 1),
    ...duplicates,
    ...frames.slice(lastSelectedIndex + 1),
  ];

  const duplicateIds = new Set(duplicates.map((f) => f.id));
  return {
    frames: newFrames,
    selection: {
      selectedFrameIds: duplicateIds,
      selectedFrameId: duplicates[0].id,
      selectionActiveId: duplicates[duplicates.length - 1].id,
    },
  };
}

export function reorderFrames(
  frames: Frame[],
  selection: SelectionState,
  fromIndex: number,
  toIndex: number,
): FrameEditResult {
  if (
    fromIndex < 0 ||
    fromIndex >= frames.length ||
    toIndex < 0 ||
    toIndex >= frames.length ||
    fromIndex === toIndex
  ) {
    return { frames, selection };
  }

  const updated = [...frames];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return { frames: updated, selection };
}

export function moveFramesToInsertionPoint(
  frames: Frame[],
  selection: SelectionState,
  insertionIndex: number,
): FrameEditResult {
  const { selectedFrameIds } = selection;
  if (selectedFrameIds.size === 0) return { frames, selection };

  const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
  const nonSelected = frames.filter((f) => !selectedFrameIds.has(f.id));

  const selectedBeforeInsertion = frames
    .slice(0, insertionIndex)
    .filter((f) => selectedFrameIds.has(f.id)).length;

  const adjustedIndex = Math.min(
    Math.max(0, insertionIndex - selectedBeforeInsertion),
    nonSelected.length,
  );

  return {
    frames: [
      ...nonSelected.slice(0, adjustedIndex),
      ...selectedInOrder,
      ...nonSelected.slice(adjustedIndex),
    ],
    selection,
  };
}

export function moveSelectedFrames(
  frames: Frame[],
  selection: SelectionState,
  targetIndex: number,
): FrameEditResult {
  const { selectedFrameIds } = selection;
  if (selectedFrameIds.size === 0) return { frames, selection };

  const targetFrame = frames[targetIndex];
  if (!targetFrame) return { frames, selection };
  if (selectedFrameIds.has(targetFrame.id)) return { frames, selection };

  const selectedInOrder = frames.filter((f) => selectedFrameIds.has(f.id));
  const nonSelected = frames.filter((f) => !selectedFrameIds.has(f.id));
  const insertAfterIndex = nonSelected.findIndex((f) => f.id === targetFrame.id);

  return {
    frames: [
      ...nonSelected.slice(0, insertAfterIndex + 1),
      ...selectedInOrder,
      ...nonSelected.slice(insertAfterIndex + 1),
    ],
    selection,
  };
}

export function moveSelectedFrameLeft(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  const firstSelectedIndex = frames.findIndex((frame) => selection.selectedFrameIds.has(frame.id));
  if (firstSelectedIndex <= 0) return { frames, selection };
  return moveFramesToInsertionPoint(frames, selection, firstSelectedIndex - 1);
}

export function moveSelectedFrameRight(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  const lastSelectedIndex = frames.reduce(
    (index, frame, currentIndex) =>
      selection.selectedFrameIds.has(frame.id) ? currentIndex : index,
    -1,
  );
  if (lastSelectedIndex === -1 || lastSelectedIndex >= frames.length - 1) {
    return { frames, selection };
  }
  return moveFramesToInsertionPoint(frames, selection, lastSelectedIndex + 2);
}

export function moveSelectedFramesToStart(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  return moveFramesToInsertionPoint(frames, selection, 0);
}

export function moveSelectedFramesToEnd(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  return moveFramesToInsertionPoint(frames, selection, frames.length);
}

export function deduplicateAdjacentMerge(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  const { selectedFrameIds, selectedFrameId, selectionActiveId } = selection;

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
    const survivingSelectedIds = new Set(dedupedSelection.map((f) => f.id));
    const newSelectedFrameId =
      survivingSelectedIds.has(selectedFrameId!)
        ? selectedFrameId
        : dedupedSelection.length > 0
          ? dedupedSelection[0].id
          : null;
    return {
      frames: result,
      selection: {
        selectedFrameIds: survivingSelectedIds,
        selectedFrameId: newSelectedFrameId,
        selectionActiveId,
      },
    };
  }

  const result: Frame[] = [];
  for (const frame of frames) {
    const previous = result[result.length - 1];
    if (previous && previous.imageData === frame.imageData) {
      result[result.length - 1] = { ...previous, duration: previous.duration + frame.duration };
    } else {
      result.push(frame);
    }
  }
  const newSelectedFrameId = result.some((f) => f.id === selectedFrameId)
    ? selectedFrameId
    : result.length > 0
      ? result[0].id
      : null;
  return {
    frames: result,
    selection: {
      selectedFrameId: newSelectedFrameId,
      selectedFrameIds: newSelectedFrameId ? new Set([newSelectedFrameId]) : new Set(),
      selectionActiveId,
    },
  };
}

export function deduplicateAdjacentDrop(
  frames: Frame[],
  selection: SelectionState,
): FrameEditResult {
  const { selectedFrameIds, selectedFrameId, selectionActiveId } = selection;

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
    const survivingSelectedIds = new Set(dedupedSelection.map((f) => f.id));
    const newSelectedFrameId =
      survivingSelectedIds.has(selectedFrameId!)
        ? selectedFrameId
        : dedupedSelection.length > 0
          ? dedupedSelection[0].id
          : null;
    return {
      frames: result,
      selection: {
        selectedFrameIds: survivingSelectedIds,
        selectedFrameId: newSelectedFrameId,
        selectionActiveId,
      },
    };
  }

  const result: Frame[] = [];
  for (const frame of frames) {
    const previous = result[result.length - 1];
    if (!previous || previous.imageData !== frame.imageData) {
      result.push(frame);
    }
  }
  const newSelectedFrameId = result.some((f) => f.id === selectedFrameId)
    ? selectedFrameId
    : result.length > 0
      ? result[0].id
      : null;
  return {
    frames: result,
    selection: {
      selectedFrameId: newSelectedFrameId,
      selectedFrameIds: newSelectedFrameId ? new Set([newSelectedFrameId]) : new Set(),
      selectionActiveId,
    },
  };
}

export function setFrameDuration(
  frames: Frame[],
  selection: SelectionState,
  duration: number,
): FrameEditResult {
  const { selectedFrameIds } = selection;
  if (selectedFrameIds.size === 0) return { frames, selection };
  const clamped = Math.min(Math.max(1, duration), 9999);
  return {
    frames: frames.map((f) => (selectedFrameIds.has(f.id) ? { ...f, duration: clamped } : f)),
    selection,
  };
}
