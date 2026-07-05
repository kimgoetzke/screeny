import { Channel, invoke } from "@tauri-apps/api/core";
import type { GifBackend } from "$lib/actions";
import type { DecodeEvent } from "$lib/types";

let currentDecodeId = 0;

const E2E_DECODE_DELAY_KEY = "screeny.e2e.decodeDelayMs";

async function waitForE2eDecodeDelay(): Promise<void> {
  const delayMs = Number(globalThis.window?.localStorage.getItem(E2E_DECODE_DELAY_KEY) ?? 0);
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;

  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

export const tauriGifBackend: GifBackend = {
  async decodeStreaming(path, onStart, onFrame, onProgress) {
    const channel = new Channel<DecodeEvent>();
    channel.onmessage = (event) => {
      if (event.type === "start") {
        onStart(event.data);
      } else if (event.type === "frame") {
        onFrame(event.data);
      } else if (event.type === "progress") {
        const percentage =
          event.data.totalBytes === 0
            ? 0
            : Math.round((event.data.bytesRead / event.data.totalBytes) * 100);
        onProgress(percentage);
      }
    };

    currentDecodeId = Date.now();
    await waitForE2eDecodeDelay();
    await invoke<void>("decode_gif_stream", {
      path,
      onEvent: channel,
      decodeId: currentDecodeId,
    });
  },
  decodeImage: (path) => invoke("decode_image_frame", { path }),
  export: (frames, path) => invoke<void>("export_gif", { frames, path }),
};

export function cancelCurrentGifDecode() {
  return invoke<void>("cancel_gif_decode", { decodeId: currentDecodeId });
}
