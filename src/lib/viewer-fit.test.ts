import { describe, expect, it } from "vitest";
import { calculateInitialViewerState } from "./viewer-fit";

describe("calculateInitialViewerState", () => {
  it("fits a portrait GIF to 80% of the visible height and centres it in the visible viewer area", () => {
    const result = calculateInitialViewerState({
      gifWidth: 200,
      gifHeight: 400,
      viewerWidth: 1200,
      viewerHeight: 800,
      visibleWidth: 945,
      visibleHeight: 800,
    });

    expect(result.baseScale).toBe(1.6);
    expect(result.baseScale * result.panX).toBeCloseTo(-127.5, 6);
    expect(result.panY).toBe(0);
  });

  it("fits a landscape GIF to 80% of the visible width", () => {
    const result = calculateInitialViewerState({
      gifWidth: 400,
      gifHeight: 200,
      viewerWidth: 1200,
      viewerHeight: 800,
      visibleWidth: 945,
      visibleHeight: 800,
    });

    expect(result.baseScale).toBe(1.89);
    expect(result.baseScale * result.panX).toBeCloseTo(-127.5, 6);
    expect(result.panY).toBe(0);
  });

  it("caps the fitted scale when the preferred 80% fill would exceed the visible viewer bounds", () => {
    const result = calculateInitialViewerState({
      gifWidth: 900,
      gifHeight: 1000,
      viewerWidth: 500,
      viewerHeight: 1000,
      visibleWidth: 200,
      visibleHeight: 1000,
    });

    expect(result.baseScale).toBe(200 / 900);
    expect(900 * result.baseScale).toBeLessThanOrEqual(200);
    expect(1000 * result.baseScale).toBeLessThanOrEqual(1000);
  });
});
