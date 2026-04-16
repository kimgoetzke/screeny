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
}

export type DecodeEvent =
  | { type: "progress"; data: { bytesRead: number; totalBytes: number } }
  | { type: "frame"; data: Frame }
  | { type: "complete"; data: { frameCount: number } };
