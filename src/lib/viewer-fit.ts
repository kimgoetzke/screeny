export interface InitialViewerStateInput {
  gifWidth: number;
  gifHeight: number;
  viewerWidth: number;
  viewerHeight: number;
  visibleWidth: number;
  visibleHeight: number;
}

export interface InitialViewerState {
  baseScale: number;
  panX: number;
  panY: number;
}

const INITIAL_FIT_RATIO = 0.8;

export function calculateInitialViewerState({
  gifWidth,
  gifHeight,
  viewerWidth,
  viewerHeight: _viewerHeight,
  visibleWidth,
  visibleHeight,
}: InitialViewerStateInput): InitialViewerState {
  if (gifWidth <= 0 || gifHeight <= 0 || viewerWidth <= 0 || visibleWidth <= 0 || visibleHeight <= 0) {
    return {
      baseScale: 1,
      panX: 0,
      panY: 0,
    };
  }

  const preferredScale =
    gifHeight > gifWidth
      ? (visibleHeight * INITIAL_FIT_RATIO) / gifHeight
      : (visibleWidth * INITIAL_FIT_RATIO) / gifWidth;
  const maxWidthScale = visibleWidth / gifWidth;
  const maxHeightScale = visibleHeight / gifHeight;
  const baseScale = Math.min(preferredScale, maxWidthScale, maxHeightScale);
  const visibleOffsetX = (visibleWidth - viewerWidth) / 2;

  return {
    baseScale,
    panX: visibleOffsetX / baseScale,
    panY: 0,
  };
}
