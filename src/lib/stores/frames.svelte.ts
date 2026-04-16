import type { Frame } from "$lib/types";

let frames = $state<Frame[]>([]);
let selectedFrameId = $state<string | null>(null);
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
    isLoading = false;
    loadingProgress = null;
  },

  addFrame(frame: Frame) {
    frames = [...frames, frame];
    if (frames.length === 1) {
      selectedFrameId = frame.id;
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
