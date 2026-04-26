export interface InitialCanvasStateInput {
  gifWidth: number;
  gifHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  visibleCanvasWidth: number;
  visibleCanvasHeight: number;
}

export interface InitialCanvasState {
  baseScale: number;
  panX: number;
  panY: number;
}

const INITIAL_FIT_RATIO = 0.7;

export function calculateInitialCanvasState({
  gifWidth,
  gifHeight,
  canvasWidth,
  canvasHeight,
  visibleCanvasWidth,
  visibleCanvasHeight,
}: InitialCanvasStateInput): InitialCanvasState {
  if (
    gifWidth <= 0 ||
    gifHeight <= 0 ||
    canvasWidth <= 0 ||
    visibleCanvasWidth <= 0 ||
    visibleCanvasHeight <= 0
  ) {
    return {
      baseScale: 1,
      panX: 0,
      panY: 0,
    };
  }

  const maxWidthScale = visibleCanvasWidth / gifWidth;
  const maxHeightScale = visibleCanvasHeight / gifHeight;
  const baseScale = Math.min(maxWidthScale, maxHeightScale) * INITIAL_FIT_RATIO;
  const visibleOffsetX = (visibleCanvasWidth - canvasWidth) / 2;
  const visibleOffsetY = (visibleCanvasHeight - canvasHeight) / 2;

  return {
    baseScale,
    panX: visibleOffsetX / baseScale,
    panY: visibleOffsetY / baseScale,
  };
}
