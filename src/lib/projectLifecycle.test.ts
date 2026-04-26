import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectLifecycle } from "./projectLifecycle";
import { frameStore } from "$lib/stores/frames.svelte";
import type { DialogProvider, GifBackend } from "$lib/actions";
import type { Frame } from "$lib/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

vi.mock("$lib/paint", () => ({
  waitForNextPaint: vi.fn(() => Promise.resolve()),
}));

function makeFrame(id: string): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration: 100, width: 10, height: 10 };
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

describe("projectLifecycle", () => {
  let loadingValues: boolean[];
  let statusValues: string[];

  beforeEach(() => {
    frameStore.clear();
    loadingValues = [];
    statusValues = [];
    vi.clearAllMocks();
  });

  function makeCycle(dialog: DialogProvider, backend: GifBackend, onLoad?: () => void) {
    return createProjectLifecycle({
      getDialog: () => dialog,
      backend,
      onLoad,
      onLoadingChange: (v: boolean) => loadingValues.push(v),
      onStatusChange: (v: string) => statusValues.push(v),
      getDecodeId: () => 0,
    });
  }

  describe("handleOpen", () => {
    it("does nothing when the dialog is cancelled", async () => {
      const { handleOpen } = makeCycle(makeDialog(null), makeBackend());
      await handleOpen();
      expect(frameStore.frames).toHaveLength(0);
      expect(frameStore.isLoading).toBe(false);
    });

    it("streams each frame individually into the store", async () => {
      const { handleOpen } = makeCycle(makeDialog("/tmp/test.gif"), makeBackend());
      await handleOpen();
      expect(frameStore.frames).toHaveLength(2);
    });

    it("calls onLoad on the first streamed frame, not on decode completion", async () => {
      const onLoad = vi.fn();
      const backend = makeBackend([makeFrame("a"), makeFrame("b"), makeFrame("c")]);
      const { handleOpen } = makeCycle(makeDialog("/tmp/test.gif"), backend, onLoad);
      await handleOpen();
      expect(onLoad).toHaveBeenCalledOnce();
    });

    it("sets loading to false in the finally block even when decode throws", async () => {
      const backend: GifBackend = {
        decodeStreaming: vi.fn(() => Promise.reject(new Error("decode failed"))),
        export: vi.fn(() => Promise.resolve()),
      };
      const { handleOpen } = makeCycle(makeDialog("/tmp/test.gif"), backend);
      await handleOpen();
      expect(loadingValues.at(-1)).toBe(false);
    });

    it("ignores late-arriving frames after the session is cancelled", async () => {
      let capturedOnFrame: ((f: Frame) => void) | undefined;
      let releaseStream: (() => void) | undefined;
      const backend: GifBackend = {
        decodeStreaming: vi.fn(async (_path, onStart, onFrame) => {
          onStart({ totalBytes: 100, totalFrames: 1 });
          capturedOnFrame = onFrame;
          await new Promise<void>((r) => { releaseStream = r; });
        }),
        export: vi.fn(() => Promise.resolve()),
      };

      const { handleOpen, handleCancelLoad } = makeCycle(makeDialog("/tmp/test.gif"), backend);
      void handleOpen();
      // Flush all pending microtasks so dialog.openFile, beforeDecode, and
      // decodeStreaming have all started before we cancel.
      await new Promise<void>((r) => setTimeout(r, 0));

      expect(capturedOnFrame).toBeDefined();
      handleCancelLoad(); // bumps loadSessionId, making isCancelled() return true

      capturedOnFrame!(makeFrame("stale")); // fires after cancel — must be ignored
      expect(frameStore.frames).toHaveLength(0);

      releaseStream!(); // clean up the pending promise
    });
  });

  describe("handleCancelLoad", () => {
    it("calls frameStore.cancelLoad and invokes cancel_gif_decode", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const backend: GifBackend = {
        decodeStreaming: vi.fn(async (): Promise<void> => { await new Promise(() => {}); }),
        export: vi.fn(() => Promise.resolve()),
      };

      const { handleOpen, handleCancelLoad } = makeCycle(makeDialog("/tmp/test.gif"), backend);
      void handleOpen();
      await new Promise<void>((r) => setTimeout(r, 0)); // let decode start
      handleCancelLoad();

      expect(frameStore.isLoading).toBe(false);
      expect(invoke).toHaveBeenCalledWith("cancel_gif_decode", expect.objectContaining({ decodeId: expect.any(Number) }));
    });
  });

  describe("handleExport", () => {
    it("exports frames to the path chosen by the dialog", async () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      const backend = makeBackend();
      const { handleExport } = makeCycle(makeDialog(null, "/tmp/out.gif"), backend);
      await handleExport();
      expect(backend.export).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ imageData: expect.any(String) })]),
        "/tmp/out.gif",
      );
    });

    it("sets loading to false in the finally block after export", async () => {
      frameStore.setFrames([makeFrame("a")]);
      const { handleExport } = makeCycle(makeDialog(null, "/tmp/out.gif"), makeBackend());
      await handleExport();
      expect(loadingValues.at(-1)).toBe(false);
    });
  });
});
