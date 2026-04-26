import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GifBackend } from "./actions";
import { openProjectFromPath } from "./projectOpen";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

vi.mock("$lib/paint", () => ({
  waitForNextPaint: vi.fn(() => Promise.resolve()),
}));

function makeFrame(id: string): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration: 100, width: 10, height: 10 };
}

function makeBackend(frames: Frame[] = [makeFrame("a"), makeFrame("b")]): GifBackend {
  return {
    decodeStreaming: vi.fn(async (_path, onStart, onFrame) => {
      onStart({ totalBytes: 100, totalFrames: frames.length });
      for (const frame of frames) {
        onFrame(frame);
      }
    }),
    export: vi.fn(() => Promise.resolve()),
  };
}

describe("openProjectFromPath", () => {
  beforeEach(() => {
    frameStore.clear();
    vi.clearAllMocks();
  });

  it("streams each frame into the store and applies first-frame setup once", async () => {
    const onFirstFrame = vi.fn();

    const result = await openProjectFromPath("/tmp/test.gif", makeBackend(), {
      onFirstFrame,
    });

    expect(result.message).toBe("Loaded 2 frames");
    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "b"]);
    expect(onFirstFrame).toHaveBeenCalledOnce();
    expect(frameStore.isLoading).toBe(false);
  });

  it("records the decoder start metadata before the first frame update", async () => {
    const checkpoints: number[] = [];
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (_path, onStart, onFrame) => {
        onStart({ totalBytes: 100, totalFrames: 2 });
        checkpoints.push(frameStore.loadingTotalFrames ?? -1);
        onFrame(makeFrame("a"));
        checkpoints.push(frameStore.loadingFrameCount);
      }),
      export: vi.fn(() => Promise.resolve()),
    };

    await openProjectFromPath("/tmp/test.gif", backend);

    expect(checkpoints).toEqual([2, 1]);
  });

  it("waits for a paint boundary before decode starts and before loading clears", async () => {
    const { waitForNextPaint } = await import("$lib/paint");
    const paintCalls: string[] = [];
    vi.mocked(waitForNextPaint).mockImplementation(async () => {
      paintCalls.push("paint");
    });

    const backend: GifBackend = {
      decodeStreaming: vi.fn(async () => {
        paintCalls.push("decode");
      }),
      export: vi.fn(() => Promise.resolve()),
    };

    await openProjectFromPath("/tmp/test.gif", backend);

    expect(paintCalls).toEqual(["paint", "decode", "paint"]);
  });

  it("ignores late frames and suppressed decode errors after cancellation", async () => {
    let capturedOnFrame: ((frame: Frame) => void) | undefined;
    let rejectStream: ((error: Error) => void) | undefined;

    const backend: GifBackend = {
      decodeStreaming: vi.fn(
        async (_path, _onStart, onFrame) =>
          await new Promise<void>((_resolve, reject) => {
            capturedOnFrame = onFrame;
            rejectStream = reject;
          }),
      ),
      export: vi.fn(() => Promise.resolve()),
    };

    const openPromise = openProjectFromPath("/tmp/test.gif", backend);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    frameStore.cancelLoad();

    capturedOnFrame?.(makeFrame("late"));
    rejectStream?.(new Error("decode cancelled"));

    const result = await openPromise;

    expect(result.message).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(frameStore.frames).toHaveLength(0);
  });
});
