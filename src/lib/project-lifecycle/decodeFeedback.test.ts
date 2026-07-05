import { describe, expect, it } from "vitest";
import { createDecodeFeedback } from "./decodeFeedback";

describe("decode feedback", () => {
  it("reports frame totals with clamped percentage", () => {
    let feedback = createDecodeFeedback("Loading");

    feedback = feedback.started({ totalBytes: 100, totalFrames: 2 });
    feedback = feedback.frameDecoded();
    feedback = feedback.frameDecoded();
    feedback = feedback.frameDecoded();

    expect(feedback.toToolbarFeedback()).toEqual({
      kind: "loading",
      label: "Loading frame 2 of 2",
      percent: 100,
    });
  });

  it("falls back to decoder progress before frames are counted", () => {
    const feedback = createDecodeFeedback("Loading");

    const progressed = feedback.progressed(25);

    expect(progressed.toToolbarFeedback()).toEqual({
      kind: "loading",
      label: "Loading 25%",
      percent: 25,
    });
  });

  it("shows indeterminate Import feedback before static images emit frames", () => {
    const feedback = createDecodeFeedback("Importing");

    expect(feedback.toToolbarFeedback()).toEqual({
      kind: "loading",
      label: "Importing…",
      percent: 0,
    });
  });

  it("shows the Loading placeholder before progress starts", () => {
    const feedback = createDecodeFeedback("Loading");

    expect(feedback.toToolbarFeedback()).toEqual({
      kind: "loading",
      label: "Loading...",
      percent: 0,
    });
  });

  it("returns a new feedback snapshot when decoder events arrive", () => {
    const feedback = createDecodeFeedback("Loading");

    const started = feedback.started({ totalBytes: 100, totalFrames: 2 });
    const decoded = started.frameDecoded();

    expect(started).not.toBe(feedback);
    expect(decoded).not.toBe(started);
    expect(decoded.toToolbarFeedback()).toEqual({
      kind: "loading",
      label: "Loading frame 1 of 2",
      percent: 50,
    });
  });
});
