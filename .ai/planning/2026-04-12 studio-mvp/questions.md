# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Frame data transfer format

Should frames be transferred over IPC as base64-encoded PNGs (simpler, browser-native decoding) or as raw RGBA byte arrays (larger but no encode/decode step)? I'm leaning towards base64 PNG — the one-time encode cost in Rust is small, and the browser can load PNGs directly into canvas via `Image` elements, which is simpler than constructing `ImageData` from raw bytes.

### Response

OK, sounds good to me.
<!-- Processed -->

## Q2: Thumbnail generation

Should thumbnails for the timeline be generated Rust-side (smaller transfer, dedicated sizes) or frontend-side (resize full frames in canvas/offscreen canvas, avoids extra Rust work)? Given the IPC boundary principle ("pixels on screen interactively → frontend"), I'm inclined to do this frontend-side.

### Response

OK, sounds good to me.
<!-- Processed -->

## Q3: Maximum frame count / memory

For the MVP, should we impose any limit on the number of frames or GIF file size? Large GIFs (1000+ frames) could consume significant memory when all frames are held in the Svelte store as base64 strings. For now I'll proceed without a limit but we can add lazy loading later.

### Response

Sounds good.
<!-- Processed -->
