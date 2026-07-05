import { afterEach, describe, expect, it, vi } from "vitest";
import { tauriGifBackend } from "./tauriGifBackend";
import type { Frame } from "$lib/types";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  Channel: class {
    onmessage: unknown;
  },
  invoke: mocks.invoke,
}));

describe("tauriGifBackend", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    mocks.invoke.mockReset();
  });

  it("decodes static images through the decode_image_frame command", async () => {
    const frame: Frame = { id: "image.png", imageData: "rgba", duration: 100, width: 1, height: 1 };
    mocks.invoke.mockResolvedValueOnce(frame);

    const result = await tauriGifBackend.decodeImage?.("/tmp/image.png");

    expect(mocks.invoke).toHaveBeenCalledWith("decode_image_frame", { path: "/tmp/image.png" });
    expect(result).toBe(frame);
  });

  it("honours the E2E decode delay before starting streaming decode", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => "100"),
      },
    });
    mocks.invoke.mockResolvedValueOnce(undefined);

    const decodePromise = tauriGifBackend.decodeStreaming(
      "/tmp/test.gif",
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    await vi.advanceTimersByTimeAsync(99);
    expect(mocks.invoke).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await decodePromise;

    expect(mocks.invoke).toHaveBeenCalledWith(
      "decode_gif_stream",
      expect.objectContaining({
        path: "/tmp/test.gif",
      }),
    );
  });
});
