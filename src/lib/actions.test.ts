import { describe, it, expect, vi } from "vitest";
import { openGifStreaming, exportGif } from "./actions";
import type { DialogProvider, GifBackend } from "./actions";
import type { Frame } from "$lib/types";

function makeFrame(id: string): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration: 100, width: 10, height: 10 };
}

function mockDialog(overrides: Partial<DialogProvider> = {}): DialogProvider {
  return {
    openFile: vi.fn().mockResolvedValue("/path/to/file.gif"),
    saveFile: vi.fn().mockResolvedValue("/some/export.gif"),
    ...overrides,
  };
}

function mockBackend(overrides: Partial<GifBackend> = {}): GifBackend {
  return {
    decodeStreaming: vi.fn().mockResolvedValue(undefined),
    export: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("openGifStreaming", () => {
  it("should return a success message with frame count", async () => {
    const frames = [makeFrame("a"), makeFrame("b")];
    const backend = mockBackend({
      decodeStreaming: vi.fn().mockImplementation((_path, _onStart, onFrame) => {
        frames.forEach(onFrame);
        return Promise.resolve();
      }),
    });
    const onFrame = vi.fn();
    const onProgress = vi.fn();

    const result = await openGifStreaming(mockDialog(), backend, onFrame, onProgress);

    expect(result.message).toBe("Loaded 2 frames");
    expect(result.error).toBeUndefined();
  });

  it("should call onFrame for each received frame", async () => {
    const frames = [makeFrame("a"), makeFrame("b")];
    const backend = mockBackend({
      decodeStreaming: vi.fn().mockImplementation((_path, _onStart, onFrame) => {
        frames.forEach(onFrame);
        return Promise.resolve();
      }),
    });
    const onFrame = vi.fn();

    await openGifStreaming(mockDialog(), backend, onFrame, vi.fn());

    expect(onFrame).toHaveBeenCalledTimes(2);
    expect(onFrame).toHaveBeenCalledWith(frames[0]);
    expect(onFrame).toHaveBeenCalledWith(frames[1]);
  });

  it("should return empty result when dialog is cancelled", async () => {
    const dialog = mockDialog({ openFile: vi.fn().mockResolvedValue(null) });
    const backend = mockBackend();

    const result = await openGifStreaming(dialog, backend, vi.fn(), vi.fn());

    expect(result.message).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(backend.decodeStreaming).not.toHaveBeenCalled();
  });

  it("should return error when dialog throws", async () => {
    const dialog = mockDialog({
      openFile: vi.fn().mockRejectedValue(new Error("portal unavailable")),
    });

    const result = await openGifStreaming(dialog, mockBackend(), vi.fn(), vi.fn());

    expect(result.error).toContain("Failed to open file dialog");
    expect(result.error).toContain("portal unavailable");
  });

  it("should return error when decode fails", async () => {
    const backend = mockBackend({
      decodeStreaming: vi.fn().mockRejectedValue(new Error("invalid GIF")),
    });

    const result = await openGifStreaming(mockDialog(), backend, vi.fn(), vi.fn());

    expect(result.error).toContain("Failed to decode GIF");
    expect(result.error).toContain("invalid GIF");
  });

  it("should pass the file path to decodeStreaming", async () => {
    const dialog = mockDialog({
      openFile: vi.fn().mockResolvedValue("/some/path/animation.gif"),
    });
    const backend = mockBackend();

    await openGifStreaming(dialog, backend, vi.fn(), vi.fn());

    expect(backend.decodeStreaming).toHaveBeenCalledWith(
      "/some/path/animation.gif",
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("should run beforeDecode after the file is chosen and before decode starts", async () => {
    const callOrder: string[] = [];
    const dialog = mockDialog({
      openFile: vi.fn().mockImplementation(async () => {
        callOrder.push("dialog");
        return "/path/to/file.gif";
      }),
    });
    const backend = mockBackend({
      decodeStreaming: vi.fn().mockImplementation(async () => {
        callOrder.push("decode");
      }),
    });

    await openGifStreaming(dialog, backend, vi.fn(), vi.fn(), {
      beforeDecode: async () => {
        callOrder.push("beforeDecode");
      },
    });

    expect(callOrder).toEqual(["dialog", "beforeDecode", "decode"]);
  });

  it("should forward start metadata before streaming frames", async () => {
    const frames = [makeFrame("a"), makeFrame("b")];
    const eventOrder: string[] = [];
    const backend = mockBackend({
      decodeStreaming: vi.fn().mockImplementation(
        async (_path, onStart, onFrame) => {
          onStart({ totalBytes: 128, totalFrames: 2 });
          frames.forEach(onFrame);
        },
      ),
    });

    await openGifStreaming(
      mockDialog(),
      backend,
      (frame) => {
        eventOrder.push(`frame:${frame.id}`);
      },
      vi.fn(),
      {
        onStart: (start) => {
          eventOrder.push(`start:${start.totalFrames}`);
        },
      },
    );

    expect(eventOrder).toEqual(["start:2", "frame:a", "frame:b"]);
  });

  it("should call onFirstFrame only for the first streamed frame", async () => {
    const frames = [makeFrame("a"), makeFrame("b")];
    const onFirstFrame = vi.fn();
    const backend = mockBackend({
      decodeStreaming: vi.fn().mockImplementation(async (_path, _onStart, onFrame) => {
        frames.forEach(onFrame);
      }),
    });

    await openGifStreaming(mockDialog(), backend, vi.fn(), vi.fn(), {
      onFirstFrame,
    });

    expect(onFirstFrame).toHaveBeenCalledTimes(1);
    expect(onFirstFrame).toHaveBeenCalledWith(frames[0]);
  });
});

describe("exportGif", () => {
  it("should export successfully", async () => {
    const frames = [makeFrame("a")];
    const result = await exportGif(mockDialog(), mockBackend(), frames);

    expect(result.message).toBe("Exported successfully");
    expect(result.error).toBeUndefined();
  });

  it("should return error when no frames", async () => {
    const result = await exportGif(mockDialog(), mockBackend(), []);

    expect(result.error).toBe("No frames to export");
  });

  it("should return empty result when save dialog is cancelled", async () => {
    const dialog = mockDialog({ saveFile: vi.fn().mockResolvedValue(null) });
    const backend = mockBackend();
    const frames = [makeFrame("a")];

    const result = await exportGif(dialog, backend, frames);

    expect(result.error).toBeUndefined();
    expect(result.message).toBeUndefined();
    expect(backend.export).not.toHaveBeenCalled();
  });

  it("should return error when save dialog throws", async () => {
    const dialog = mockDialog({
      saveFile: vi.fn().mockRejectedValue(new Error("portal unavailable")),
    });

    const result = await exportGif(dialog, mockBackend(), [makeFrame("a")]);

    expect(result.error).toContain("Failed to open save dialog");
    expect(result.error).toContain("portal unavailable");
  });

  it("should return error when export fails", async () => {
    const backend = mockBackend({
      export: vi.fn().mockRejectedValue(new Error("write failed")),
    });

    const result = await exportGif(mockDialog(), backend, [makeFrame("a")]);

    expect(result.error).toContain("Failed to export GIF");
    expect(result.error).toContain("write failed");
  });

  it("should pass only imageData and duration to export", async () => {
    const backend = mockBackend();
    const frames = [makeFrame("a")];

    await exportGif(mockDialog(), backend, frames);

    expect(backend.export).toHaveBeenCalledWith(
      [{ imageData: "data:image/png;base64,a", duration: 100 }],
      "/some/export.gif",
    );
  });
});
