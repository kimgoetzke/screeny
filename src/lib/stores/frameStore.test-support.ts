import { beforeEach } from "vitest";
import { frameStore } from "./frames.svelte";
import type { Frame } from "$lib/types";

export function resetFrameStoreBeforeEach(): void {
  beforeEach(() => {
    frameStore.clear();
  });
}

export function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

export function makeFrameWithData(id: string, imageData: string, duration = 100): Frame {
  return { id, imageData, duration, width: 10, height: 10 };
}
