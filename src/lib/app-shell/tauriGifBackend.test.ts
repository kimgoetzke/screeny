import { describe, expect, it, vi } from "vitest";
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
  it("decodes static images through the decode_image_frame command", async () => {
    const frame: Frame = { id: "image.png", imageData: "rgba", duration: 100, width: 1, height: 1 };
    mocks.invoke.mockResolvedValueOnce(frame);

    const result = await tauriGifBackend.decodeImage?.("/tmp/image.png");

    expect(mocks.invoke).toHaveBeenCalledWith("decode_image_frame", { path: "/tmp/image.png" });
    expect(result).toBe(frame);
  });
});
