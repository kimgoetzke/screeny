import { describe, it, expect, vi } from "vitest";
import { openGif, exportGif } from "./actions";
import type { DialogProvider, GifBackend } from "./actions";
import type { Frame } from "$lib/types";

function makeFrame(id: string): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration: 100, width: 10, height: 10 };
}

function mockDialog(overrides: Partial<DialogProvider> = {}): DialogProvider {
  return {
    openFile: vi.fn().mockResolvedValue("/some/file.gif"),
    saveFile: vi.fn().mockResolvedValue("/some/export.gif"),
    ...overrides,
  };
}

function mockBackend(overrides: Partial<GifBackend> = {}): GifBackend {
  return {
    decode: vi.fn().mockResolvedValue([makeFrame("a"), makeFrame("b")]),
    export: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("openGif", () => {
  it("should return frames on success", async () => {
    const result = await openGif(mockDialog(), mockBackend());

    expect(result.frames).toHaveLength(2);
    expect(result.message).toBe("Loaded 2 frames");
    expect(result.error).toBeUndefined();
  });

  it("should return empty result when dialog is cancelled", async () => {
    const dialog = mockDialog({ openFile: vi.fn().mockResolvedValue(null) });
    const backend = mockBackend();

    const result = await openGif(dialog, backend);

    expect(result.frames).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(backend.decode).not.toHaveBeenCalled();
  });

  it("should return error when dialog throws", async () => {
    const dialog = mockDialog({
      openFile: vi.fn().mockRejectedValue(new Error("portal unavailable")),
    });

    const result = await openGif(dialog, mockBackend());

    expect(result.error).toContain("Failed to open file dialog");
    expect(result.error).toContain("portal unavailable");
    expect(result.frames).toBeUndefined();
  });

  it("should return error when decode fails", async () => {
    const backend = mockBackend({
      decode: vi.fn().mockRejectedValue(new Error("invalid GIF")),
    });

    const result = await openGif(mockDialog(), backend);

    expect(result.error).toContain("Failed to decode GIF");
    expect(result.error).toContain("invalid GIF");
    expect(result.frames).toBeUndefined();
  });

  it("should pass the dialog path to decode", async () => {
    const dialog = mockDialog({
      openFile: vi.fn().mockResolvedValue("/home/user/test.gif"),
    });
    const backend = mockBackend();

    await openGif(dialog, backend);

    expect(backend.decode).toHaveBeenCalledWith("/home/user/test.gif");
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
