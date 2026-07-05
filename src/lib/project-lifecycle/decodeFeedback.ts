import type { DecodeStart } from "$lib/types";

export type ToolbarFeedback =
  | { kind: "none" }
  | { kind: "loading"; label: string; percent: number }
  | { kind: "status"; message: string };

export type DecodeFeedbackVerb = "Loading" | "Importing";

export interface DecodeFeedback {
  started(start: DecodeStart): DecodeFeedback;
  frameDecoded(): DecodeFeedback;
  progressed(progress: number): DecodeFeedback;
  toToolbarFeedback(): ToolbarFeedback;
}

interface DecodeFeedbackState {
  verb: DecodeFeedbackVerb;
  progress: number | null;
  frameCount: number;
  totalFrames: number | null;
}

function loadingPlaceholder(verb: DecodeFeedbackVerb): string {
  return verb === "Importing" ? "Importing…" : "Loading...";
}

function toToolbarFeedback(feedback: DecodeFeedbackState): ToolbarFeedback {
  if (feedback.totalFrames !== null && feedback.totalFrames > 0 && feedback.frameCount > 0) {
    const clampedLoadedFrames = Math.min(feedback.frameCount, feedback.totalFrames);
    return {
      kind: "loading",
      label: `${feedback.verb} frame ${clampedLoadedFrames} of ${feedback.totalFrames}`,
      percent: Math.round((clampedLoadedFrames / feedback.totalFrames) * 100),
    };
  }

  if (feedback.progress !== null && feedback.progress > 0) {
    return {
      kind: "loading",
      label: `${feedback.verb} ${feedback.progress}%`,
      percent: feedback.progress,
    };
  }

  return {
    kind: "loading",
    label: loadingPlaceholder(feedback.verb),
    percent: feedback.progress ?? 0,
  };
}

function createDecodeFeedbackSnapshot(state: DecodeFeedbackState): DecodeFeedback {
  return {
    started(start: DecodeStart): DecodeFeedback {
      return createDecodeFeedbackSnapshot({
        ...state,
        totalFrames: start.totalFrames,
        frameCount: 0,
      });
    },

    frameDecoded(): DecodeFeedback {
      return createDecodeFeedbackSnapshot({
        ...state,
        frameCount: state.frameCount + 1,
      });
    },

    progressed(progress: number): DecodeFeedback {
      return createDecodeFeedbackSnapshot({
        ...state,
        progress,
      });
    },

    toToolbarFeedback(): ToolbarFeedback {
      return toToolbarFeedback(state);
    },
  };
}

export function createDecodeFeedback(verb: DecodeFeedbackVerb): DecodeFeedback {
  return createDecodeFeedbackSnapshot({ verb, progress: 0, frameCount: 0, totalFrames: null });
}
