export const INSPECTOR_LAYOUT = {
  rightInset: 15,
  expandedWidth: 240,
  minimisedWidth: 32,
} as const;

export function getVisibleCanvasWidth({
  canvasWidth,
  inspectorVisible,
  inspectorMinimised,
}: {
  canvasWidth: number;
  inspectorVisible: boolean;
  inspectorMinimised: boolean;
}) {
  if (!inspectorVisible) return canvasWidth;

  const inspectorWidth = inspectorMinimised
    ? INSPECTOR_LAYOUT.minimisedWidth
    : INSPECTOR_LAYOUT.expandedWidth;

  return Math.max(canvasWidth - INSPECTOR_LAYOUT.rightInset - inspectorWidth, 1);
}
