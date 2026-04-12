import type { Frame } from "$lib/types";

let frames = $state<Frame[]>([]);
let selectedFrameId = $state<string | null>(null);

export const frameStore = {
  get frames() {
    return frames;
  },

  get selectedFrameId() {
    return selectedFrameId;
  },

  get selectedFrame(): Frame | undefined {
    return frames.find((f) => f.id === selectedFrameId);
  },

  get hasFrames(): boolean {
    return frames.length > 0;
  },

  setFrames(newFrames: Frame[]) {
    frames = newFrames;
    if (newFrames.length > 0) {
      selectedFrameId = newFrames[0].id;
    } else {
      selectedFrameId = null;
    }
  },

  selectFrame(id: string) {
    if (frames.some((f) => f.id === id)) {
      selectedFrameId = id;
    }
  },

  deleteFrame(id: string) {
    const index = frames.findIndex((f) => f.id === id);
    if (index === -1) return;

    frames = frames.filter((f) => f.id !== id);

    // Adjust selection
    if (selectedFrameId === id) {
      if (frames.length === 0) {
        selectedFrameId = null;
      } else {
        // Select the frame at the same index, or the last frame
        const newIndex = Math.min(index, frames.length - 1);
        selectedFrameId = frames[newIndex].id;
      }
    }
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

  clear() {
    frames = [];
    selectedFrameId = null;
  },
};
