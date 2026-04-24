export interface Frame {
  id: string;
  imageData: string;
  duration: number;
  width: number;
  height: number;
}

export interface ExportFrame {
  imageData: string;
  duration: number;
  width: number;
  height: number;
}

export interface DecodeStart {
  totalBytes: number;
  totalFrames: number;
}

export type DecodeEvent =
  | { type: "start"; data: DecodeStart }
  | { type: "progress"; data: { bytesRead: number; totalBytes: number } }
  | { type: "frame"; data: Frame }
  | { type: "complete"; data: { frameCount: number } };
