import { describe, expect, it } from "vitest";
import { getVisibleCanvasWidth } from "./inspectorLayout";

describe("inspectorLayout", () => {
  it("derives visible canvas width from the inspector layout contract", () => {
    expect(getVisibleCanvasWidth({ canvasWidth: 1000, inspectorVisible: false, inspectorMinimised: false })).toBe(1000);
    expect(getVisibleCanvasWidth({ canvasWidth: 1000, inspectorVisible: true, inspectorMinimised: false })).toBe(745);
    expect(getVisibleCanvasWidth({ canvasWidth: 1000, inspectorVisible: true, inspectorMinimised: true })).toBe(953);
  });
});
