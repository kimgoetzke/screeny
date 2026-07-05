import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectLifecycle } from "./projectLifecycle.svelte";
import { frameStore } from "$lib/stores/frames.svelte";
import type { DialogProvider, GifBackend } from "$lib/actions";
import type { Frame } from "$lib/types";

vi.mock("$lib/canvas/paint", () => ({
  waitForNextPaint: vi.fn(() => Promise.resolve()),
}));

function makeFrame(id: string): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration: 100, width: 10, height: 10 };
}

function makeRgbaFrame(id: string, width: number, height: number, pixels: number[]): Frame {
  return { id, imageData: btoa(String.fromCharCode(...pixels)), duration: 100, width, height };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeDialog(openPath: string | null, savePath: string | null = "/tmp/out.gif"): DialogProvider {
  return {
    openFile: vi.fn(() => Promise.resolve(openPath)),
    saveFile: vi.fn(() => Promise.resolve(savePath)),
  };
}

function makeBackend(frames: Frame[] = [makeFrame("a"), makeFrame("b")]): GifBackend {
  return {
    decodeStreaming: vi.fn(async (_path, onStart, onFrame, _onProgress) => {
      onStart({ totalBytes: 100, totalFrames: frames.length });
      for (const frame of frames) onFrame(frame);
    }),
    export: vi.fn(() => Promise.resolve()),
  };
}

function makeLifecycle(options: {
  dialog?: DialogProvider;
  backend?: GifBackend;
  onFirstFrame?: () => Promise<void> | void;
}) {
  const cancelDecode = vi.fn(() => Promise.resolve());

  return {
    cancelDecode,
    lifecycle: createProjectLifecycle({
      dialog: options.dialog ?? makeDialog("/tmp/test.gif"),
      backend: options.backend ?? makeBackend(),
      onFirstFrame: options.onFirstFrame,
      cancelDecode,
    }),
  };
}

describe("projectLifecycle", () => {
  beforeEach(() => {
    frameStore.clear();
    vi.clearAllMocks();
  });

  it("starts empty with explicit Project State and derived capabilities", () => {
    const { lifecycle } = makeLifecycle({});

    expect(lifecycle.projectState).toBe("Empty");
    expect(lifecycle.hasProject).toBe(false);
    expect(lifecycle.closeRequested).toBe(false);
    expect(lifecycle.toolbarFeedback).toEqual({ kind: "none" });
    expect(lifecycle.canOpen).toBe(true);
    expect(lifecycle.canCancel).toBe(false);
    expect(lifecycle.canClose).toBe(false);
    expect(lifecycle.canExport).toBe(false);
  });

  it("openFromPath(path) enters Loading, derives progress feedback, and settles in Active", async () => {
    const streamGate = deferred<void>();
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (_path, onStart, onFrame, onProgress) => {
        onStart({ totalBytes: 100, totalFrames: 2 });
        onProgress(25);
        onFrame(makeFrame("a"));
        await streamGate.promise;
        onFrame(makeFrame("b"));
      }),
      export: vi.fn(() => Promise.resolve()),
    };

    const onFirstFrame = vi.fn();
    const { lifecycle } = makeLifecycle({ backend, onFirstFrame });
    const openPromise = lifecycle.openFromPath("/tmp/test.gif");

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(lifecycle.projectState).toBe("Loading");
    expect(lifecycle.canCancel).toBe(true);
    expect(lifecycle.toolbarFeedback).toEqual({
      kind: "loading",
      label: "Loading frame 1 of 2",
      percent: 50,
    });

    streamGate.resolve();
    const result = await openPromise;

    expect(result).toEqual({ message: "Loaded 2 frames" });
    expect(lifecycle.projectState).toBe("Active");
    expect(lifecycle.hasProject).toBe(true);
    expect(lifecycle.closeRequested).toBe(false);
    expect(lifecycle.toolbarFeedback).toEqual({ kind: "none" });
    expect(onFirstFrame).toHaveBeenCalledOnce();
  });

  it("open() uses the dialog and records completion feedback for toolbar callers", async () => {
    const dialog = makeDialog("/tmp/from-dialog.gif");
    const { lifecycle } = makeLifecycle({ dialog, backend: makeBackend([makeFrame("dialog")]) });

    await lifecycle.open();

    expect(dialog.openFile).toHaveBeenCalledOnce();
    expect(lifecycle.projectState).toBe("Active");
    expect(lifecycle.toolbarFeedback).toEqual({
      kind: "status",
      message: "Loaded 1 frames",
    });
  });

  it("cancel() clears the Project, requests decode cancellation, and ignores stale frames", async () => {
    let capturedOnFrame: ((frame: Frame) => void) | undefined;
    const streamGate = deferred<void>();
    const backend: GifBackend = {
      decodeStreaming: vi.fn(
        async (_path, onStart, onFrame) => {
          onStart({ totalBytes: 100, totalFrames: 1 });
          capturedOnFrame = onFrame;
          await streamGate.promise;
        },
      ),
      export: vi.fn(() => Promise.resolve()),
    };

    const { lifecycle, cancelDecode } = makeLifecycle({ backend });
    const openPromise = lifecycle.openFromPath("/tmp/test.gif");

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await lifecycle.cancel();

    expect(lifecycle.projectState).toBe("Empty");
    expect(lifecycle.hasProject).toBe(false);
    expect(lifecycle.toolbarFeedback).toEqual({ kind: "none" });
    expect(cancelDecode).toHaveBeenCalledOnce();

    capturedOnFrame?.(makeFrame("stale"));
    streamGate.reject(new Error("decode cancelled"));

    await expect(openPromise).resolves.toEqual({});
    expect(frameStore.frames).toHaveLength(0);
  });

  it("ignores superseded opens so only the latest Open can activate the Project", async () => {
    const firstStreamGate = deferred<void>();
    let firstOnFrame: ((frame: Frame) => void) | undefined;
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (_path, onStart, onFrame) => {
        onStart({ totalBytes: 100, totalFrames: 1 });
        if (!firstOnFrame) {
          firstOnFrame = onFrame;
          await firstStreamGate.promise;
          return;
        }
        onFrame(makeFrame("fresh"));
      }),
      export: vi.fn(() => Promise.resolve()),
    };

    const { lifecycle } = makeLifecycle({ backend });

    const firstOpen = lifecycle.openFromPath("/tmp/first.gif");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const secondOpen = lifecycle.openFromPath("/tmp/second.gif");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    firstOnFrame?.(makeFrame("stale"));
    firstStreamGate.resolve();

    await expect(firstOpen).resolves.toEqual({});
    await expect(secondOpen).resolves.toEqual({ message: "Loaded 1 frames" });
    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["fresh"]);
    expect(lifecycle.projectState).toBe("Active");
  });

  it("requestClose(), dismissClose(), and confirmClose() manage close confirmation inside the seam", async () => {
    const { lifecycle } = makeLifecycle({ backend: makeBackend([makeFrame("a")]) });
    await lifecycle.openFromPath("/tmp/test.gif");

    lifecycle.requestClose();
    expect(lifecycle.closeRequested).toBe(true);

    lifecycle.dismissClose();
    expect(lifecycle.closeRequested).toBe(false);

    lifecycle.requestClose();
    lifecycle.confirmClose();

    expect(lifecycle.projectState).toBe("Empty");
    expect(lifecycle.hasProject).toBe(false);
    expect(lifecycle.closeRequested).toBe(false);
    expect(frameStore.frames).toHaveLength(0);
  });

  it("importFrames() chooses a file, decodes GIF frames, normalises them, and inserts after the selected frame", async () => {
    const existingFrames = [
      makeRgbaFrame("a", 2, 2, new Array(16).fill(0)),
      makeRgbaFrame("b", 2, 2, new Array(16).fill(0)),
    ];
    const importedFrame = makeRgbaFrame("imported", 1, 1, [255, 0, 0, 255]);
    const dialog = makeDialog("/tmp/import.gif");
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (path, onStart, onFrame) => {
        const frames = path === "/tmp/current.gif" ? existingFrames : [importedFrame];
        onStart({ totalBytes: 100, totalFrames: frames.length });
        frames.forEach(onFrame);
      }),
      export: vi.fn(() => Promise.resolve()),
    };
    const { lifecycle } = makeLifecycle({ dialog, backend });

    await lifecycle.openFromPath("/tmp/current.gif");
    frameStore.selectFrame("a");
    await lifecycle.importFrames();

    expect(dialog.openFile).toHaveBeenCalledWith(expect.objectContaining({ confirmLabel: "Import" }));
    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "imported", "b"]);
    expect(frameStore.frames[1]).toMatchObject({ width: 2, height: 2 });
    expect(lifecycle.projectState).toBe("Active");
    expect(lifecycle.toolbarFeedback).toEqual({ kind: "status", message: "Imported 1 frame" });
  });

  it("imports static images through the backend image decoder", async () => {
    const existingFrame = makeRgbaFrame("a", 2, 2, new Array(16).fill(0));
    const imageFrame = makeRgbaFrame("image.png", 1, 1, [255, 0, 0, 255]);
    const dialog = makeDialog("/tmp/image.png");
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (_path, onStart, onFrame) => {
        onStart({ totalBytes: 100, totalFrames: 1 });
        onFrame(existingFrame);
      }),
      decodeImage: vi.fn(async () => imageFrame),
      export: vi.fn(() => Promise.resolve()),
    };
    const { lifecycle } = makeLifecycle({ dialog, backend });

    await lifecycle.openFromPath("/tmp/current.gif");
    await lifecycle.importFrames();

    expect(backend.decodeImage).toHaveBeenCalledWith("/tmp/image.png");
    expect(frameStore.frames.map((frame) => frame.id)).toEqual(["a", "image.png"]);
  });

  it("records an acknowledgement warning when imported frames use a different aspect ratio", async () => {
    const existingFrame = makeRgbaFrame("a", 2, 2, new Array(16).fill(0));
    const importedFrame = makeRgbaFrame("wide", 2, 1, [
      255, 0, 0, 255,
      0, 255, 0, 255,
    ]);
    const dialog = makeDialog("/tmp/import.gif");
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (path, onStart, onFrame) => {
        const frames = path === "/tmp/current.gif" ? [existingFrame] : [importedFrame];
        onStart({ totalBytes: 100, totalFrames: frames.length });
        frames.forEach(onFrame);
      }),
      export: vi.fn(() => Promise.resolve()),
    };
    const { lifecycle } = makeLifecycle({ dialog, backend });

    await lifecycle.openFromPath("/tmp/current.gif");
    await lifecycle.importFrames();

    expect(lifecycle.aspectRatioWarning).toContain("different aspect ratio");
    lifecycle.dismissAspectRatioWarning();
    expect(lifecycle.aspectRatioWarning).toBeNull();
  });

  it("export() moves through Exporting and returns to Active with status feedback", async () => {
    const exportGate = deferred<void>();
    const dialog = makeDialog("/tmp/test.gif", "/tmp/out.gif");
    const backend: GifBackend = {
      decodeStreaming: vi.fn(async (_path, onStart, onFrame) => {
        onStart({ totalBytes: 100, totalFrames: 1 });
        onFrame(makeFrame("a"));
      }),
      export: vi.fn(async () => {
        await exportGate.promise;
      }),
    };

    const { lifecycle } = makeLifecycle({ dialog, backend });
    await lifecycle.openFromPath("/tmp/test.gif");

    const exportPromise = lifecycle.export();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(lifecycle.projectState).toBe("Exporting");
    expect(lifecycle.toolbarFeedback).toEqual({
      kind: "status",
      message: "Exporting…",
    });

    exportGate.resolve();
    await exportPromise;

    expect(backend.export).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ imageData: expect.any(String) })]),
      "/tmp/out.gif",
    );
    expect(lifecycle.projectState).toBe("Active");
    expect(lifecycle.toolbarFeedback).toEqual({
      kind: "status",
      message: "Exported successfully",
    });
  });
});
