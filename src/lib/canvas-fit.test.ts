import { describe, expect, it } from "vitest";
import { calculateInitialCanvasState } from "./canvas-fit";

describe("calculateInitialCanvasState", () => {
  it("fits a portrait GIF to 70% of the visible height and centres it in the visible canvas area", () => {
    const result = calculateInitialCanvasState({
      gifWidth: 200,
      gifHeight: 400,
      canvasWidth: 1200,
      canvasHeight: 800,
      visibleCanvasWidth: 945,
      visibleCanvasHeight: 800,
    });

    expect(result.baseScale).toBe(1.4);
    expect(result.baseScale * result.panX).toBeCloseTo(-127.5, 6);
    expect(result.panY).toBe(0);
  });

  it("fits a landscape GIF to 70% of the visible width", () => {
    const result = calculateInitialCanvasState({
      gifWidth: 400,
      gifHeight: 200,
      canvasWidth: 1200,
      canvasHeight: 800,
      visibleCanvasWidth: 945,
      visibleCanvasHeight: 800,
    });

    expect(result.baseScale).toBeCloseTo(1.65375, 6);
    expect(result.baseScale * result.panX).toBeCloseTo(-127.5, 6);
    expect(result.panY).toBe(0);
  });

  it("uses the smaller visible dimension so the closest edges keep a 15% margin", () => {
    const result = calculateInitialCanvasState({
      gifWidth: 900,
      gifHeight: 1000,
      canvasWidth: 500,
      canvasHeight: 1000,
      visibleCanvasWidth: 200,
      visibleCanvasHeight: 1000,
    });

    expect(result.baseScale).toBeCloseTo((200 / 900) * 0.7, 6);
    expect(900 * result.baseScale).toBeCloseTo(140, 6);
    expect(1000 * result.baseScale).toBeCloseTo(155.5555555556, 6);
  });
});
