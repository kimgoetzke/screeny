import { Channel, invoke } from "@tauri-apps/api/core";
import type { GifBackend } from "$lib/actions";
import type { DecodeEvent } from "$lib/types";

let currentDecodeId = 0;

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
    await invoke<void>("decode_gif_stream", {
      path,
      onEvent: channel,
      decodeId: currentDecodeId,
    });
  },
  export: (frames, path) => invoke<void>("export_gif", { frames, path }),
};

export function cancelCurrentGifDecode() {
  return invoke<void>("cancel_gif_decode", { decodeId: currentDecodeId });
}
