import type { ActionResult, GifBackend } from "$lib/actions";
import { decodeGifPathStreaming } from "$lib/actions";
import { waitForNextPaint } from "$lib/paint";
import { frameStore } from "$lib/stores/frames.svelte";

export interface OpenProjectFromPathOptions {
  onFirstFrame?: () => Promise<void> | void;
  isCancelled?: () => boolean;
}

export async function openProjectFromPath(
  path: string,
  backend: GifBackend,
  options: OpenProjectFromPathOptions = {},
): Promise<ActionResult> {
  frameStore.startLoading();
  const sessionAtStart = frameStore.loadSessionId;

  await waitForNextPaint();

  try {
    return await decodeGifPathStreaming(
      path,
      backend,
      (frame) => {
        if (frameStore.loadSessionId === sessionAtStart) {
          frameStore.addFrame(frame);
        }
      },
      (progress) => {
        if (frameStore.loadSessionId === sessionAtStart) {
          frameStore.setLoadingProgress(progress);
        }
      },
      {
        onStart: (start) => {
          if (frameStore.loadSessionId === sessionAtStart) {
            frameStore.setLoadingTotalFrames(start.totalFrames);
          }
        },
        onFirstFrame: options.onFirstFrame,
        isCancelled: () =>
          frameStore.loadSessionId !== sessionAtStart || options.isCancelled?.() === true,
      },
    );
  } finally {
    if (frameStore.isLoading && frameStore.loadSessionId === sessionAtStart) {
      await waitForNextPaint();
      frameStore.finishLoading();
    }
  }
}
