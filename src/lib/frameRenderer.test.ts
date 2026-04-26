import { describe, expect, it, vi } from "vitest";
import { renderFrameToCanvas } from "./frameRenderer";
import type { Frame } from "$lib/types";

// ImageData is a browser API not available in the Node.js test environment
class MockImageData {
  constructor(
    public readonly data: Uint8ClampedArray,
    public readonly width: number,
    public readonly height: number,
  ) {}
}
vi.stubGlobal("ImageData", MockImageData);

function makeRgbaFrame(width: number, height: number): Frame {
  const bytes = new Uint8Array(width * height * 4);
  const imageData = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
  return { id: "test", imageData, duration: 100, width, height };
}

function makeCanvas() {
  let canvasWidth = 0;
  let canvasHeight = 0;
  const putImageData = vi.fn();
  const ctx = { putImageData };
  const canvas = {
    get width() {
      return canvasWidth;
    },
    set width(v: number) {
      canvasWidth = v;
    },
    get height() {
      return canvasHeight;
    },
    set height(v: number) {
      canvasHeight = v;
    },
    getContext: vi.fn().mockReturnValue(ctx),
  } as unknown as HTMLCanvasElement;
  return { canvas, putImageData };
}

describe("renderFrameToCanvas", () => {
  it("sets canvas dimensions to the frame dimensions", () => {
    const frame = makeRgbaFrame(20, 15);
    const { canvas } = makeCanvas();

    renderFrameToCanvas(canvas, frame);

    expect(canvas.width).toBe(20);
    expect(canvas.height).toBe(15);
  });

  it("calls putImageData once with origin at (0, 0)", () => {
    const frame = makeRgbaFrame(1, 1);
    const { canvas, putImageData } = makeCanvas();

    renderFrameToCanvas(canvas, frame);

    expect(putImageData).toHaveBeenCalledOnce();
    const [, x, y] = putImageData.mock.calls[0] as [unknown, number, number];
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it("passes an ImageData with the correct dimensions to putImageData", () => {
    const frame = makeRgbaFrame(4, 3);
    const { canvas, putImageData } = makeCanvas();

    renderFrameToCanvas(canvas, frame);

    const [imageData] = putImageData.mock.calls[0] as [MockImageData];
    expect(imageData).toBeInstanceOf(MockImageData);
    expect(imageData.width).toBe(4);
    expect(imageData.height).toBe(3);
  });

  it("passes the correct number of decoded bytes to ImageData", () => {
    const frame = makeRgbaFrame(4, 3);
    const { canvas, putImageData } = makeCanvas();

    renderFrameToCanvas(canvas, frame);

    const [imageData] = putImageData.mock.calls[0] as [MockImageData];
    expect(imageData.data.length).toBe(4 * 3 * 4); // width * height * 4 channels
  });

  it("does nothing when getContext returns null", () => {
    const frame = makeRgbaFrame(1, 1);
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
    } as unknown as HTMLCanvasElement;

    expect(() => renderFrameToCanvas(canvas, frame)).not.toThrow();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
});
