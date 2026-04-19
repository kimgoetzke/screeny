/**
 * Generates tests/fixtures/dedup-selection.gif — a 4-frame 4×4 GIF:
 *   Frame 0: solid red,  100 ms  (delay=10 centiseconds)
 *   Frame 1: solid red,  200 ms  (delay=20 centiseconds) ← adjacent duplicate of frame 0
 *   Frame 2: solid blue, 100 ms  (delay=10 centiseconds)
 *   Frame 3: solid blue, 150 ms  (delay=15 centiseconds) ← adjacent duplicate of frame 2
 *
 * Used by E2E selection-scoped deduplication tests to assert that:
 *   - selecting frames 0–1 then dedup-merge yields [red(300ms), blue(100ms), blue(150ms)]
 *   - selecting frames 0–1 then dedup-drop  yields [red(100ms), blue(100ms), blue(150ms)]
 *   - single-select (frame 0) then dedup-merge yields [red(300ms), blue(250ms)]
 *   - single-select (frame 0) then dedup-drop  yields [red(100ms), blue(100ms)]
 *
 * Run once to produce the binary fixture:
 *   node tests/fixtures/create-dedup-selection-fixture.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Minimal GIF89a encoder
// ---------------------------------------------------------------------------

class BitWriter {
  constructor() {
    this._bytes = [];
    this._current = 0;
    this._bitPos = 0;
  }

  writeBits(value, numBits) {
    for (let i = 0; i < numBits; i++) {
      this._current |= ((value >> i) & 1) << this._bitPos;
      this._bitPos++;
      if (this._bitPos === 8) {
        this._bytes.push(this._current);
        this._current = 0;
        this._bitPos = 0;
      }
    }
  }

  flush() {
    if (this._bitPos > 0) {
      this._bytes.push(this._current);
      this._current = 0;
      this._bitPos = 0;
    }
    return Uint8Array.from(this._bytes);
  }
}

/**
 * Encode `pixels` (array of palette indices) using GIF LZW with the given
 * minimum code size.  Returns raw LZW bytes (not yet wrapped in sub-blocks).
 */
function lzwEncode(pixels, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const writer = new BitWriter();

  let codeSize = minCodeSize + 1;
  let nextCode = clearCode + 2;
  /** @type {Map<string, number>} */
  let table = new Map();

  const resetTable = () => {
    table = new Map();
    for (let i = 0; i < clearCode; i++) {
      table.set(`${i}`, i);
    }
    codeSize = minCodeSize + 1;
    nextCode = clearCode + 2;
  };

  resetTable();
  writer.writeBits(clearCode, codeSize);

  let current = `${pixels[0]}`;

  for (let i = 1; i < pixels.length; i++) {
    const combined = `${current},${pixels[i]}`;
    if (table.has(combined)) {
      current = combined;
    } else {
      writer.writeBits(table.get(current), codeSize);

      if (nextCode < 4096) {
        table.set(combined, nextCode++);
        // Increase code size when we've just added the last code that fits
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writer.writeBits(clearCode, codeSize);
        resetTable();
      }

      current = `${pixels[i]}`;
    }
  }

  writer.writeBits(table.get(current), codeSize);
  writer.writeBits(eoiCode, codeSize);

  return writer.flush();
}

/** Wrap raw bytes in GIF sub-blocks (max 255 bytes each) plus a terminator. */
function packSubBlocks(data) {
  const out = [];
  let offset = 0;
  while (offset < data.length) {
    const blockSize = Math.min(255, data.length - offset);
    out.push(blockSize);
    for (let i = 0; i < blockSize; i++) {
      out.push(data[offset++]);
    }
  }
  out.push(0); // block terminator
  return out;
}

/**
 * Build bytes for one GIF frame (Graphic Control Extension + Image Descriptor
 * + Image Data).
 *
 * @param {number}   width
 * @param {number}   height
 * @param {number[]} pixels     palette indices, length == width*height
 * @param {number}   delay      centiseconds (GIF unit)
 * @param {number}   numColors  palette size (must be a power of 2)
 */
function buildFrame(width, height, pixels, delay, numColors) {
  const out = [];
  const minCodeSize = Math.max(2, Math.ceil(Math.log2(numColors)));

  // Graphic Control Extension
  out.push(0x21, 0xf9); // extension introducer + GCE label
  out.push(4); // block size
  out.push(0); // packed: disposal=0, no user input, no transparent
  out.push(delay & 0xff, (delay >> 8) & 0xff); // delay
  out.push(0); // transparent colour index (unused)
  out.push(0); // block terminator

  // Image Descriptor
  out.push(0x2c); // image separator
  out.push(0, 0, 0, 0); // left, top
  out.push(width & 0xff, (width >> 8) & 0xff);
  out.push(height & 0xff, (height >> 8) & 0xff);
  out.push(0); // packed: no local colour table, not interlaced

  // Image Data
  out.push(minCodeSize);
  const lzw = lzwEncode(pixels, minCodeSize);
  out.push(...packSubBlocks(lzw));

  return out;
}

// ---------------------------------------------------------------------------
// Compose dedup-selection.gif
// ---------------------------------------------------------------------------

const WIDTH = 4;
const HEIGHT = 4;

// Palette (must be 2^n entries; 4 entries → GCT size field = 1)
// Index 0 = red, Index 1 = blue, Index 2/3 = padding black
const palette = [
  [255, 0, 0], // 0: red
  [0, 0, 255], // 1: blue
  [0, 0, 0], // 2: black (padding)
  [0, 0, 0], // 3: black (padding)
];
const NUM_COLORS = palette.length; // 4

const RED_PIXELS = new Array(WIDTH * HEIGHT).fill(0); // all red
const BLUE_PIXELS = new Array(WIDTH * HEIGHT).fill(1); // all blue

const gif = [];

// Header
gif.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // "GIF89a"

// Logical Screen Descriptor
// Packed byte: GCT flag=1, colour resolution=1 (2-bit), sort=0, GCT size=1 (4 entries)
gif.push(WIDTH & 0xff, (WIDTH >> 8) & 0xff);
gif.push(HEIGHT & 0xff, (HEIGHT >> 8) & 0xff);
gif.push(0b10010001); // packed
gif.push(0); // background colour index
gif.push(0); // pixel aspect ratio

// Global Colour Table
for (const [r, g, b] of palette) {
  gif.push(r, g, b);
}

// Netscape Application Extension (loop forever)
gif.push(0x21, 0xff); // extension introducer + app ext label
gif.push(11); // block size
gif.push(...[0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]); // "NETSCAPE2.0"
gif.push(3); // sub-block size
gif.push(1); // sub-block ID
gif.push(0, 0); // loop count = 0 (infinite)
gif.push(0); // block terminator

// Frame 0: red, 100 ms
gif.push(...buildFrame(WIDTH, HEIGHT, RED_PIXELS, 10, NUM_COLORS));
// Frame 1: red, 200 ms  (adjacent duplicate of frame 0)
gif.push(...buildFrame(WIDTH, HEIGHT, RED_PIXELS, 20, NUM_COLORS));
// Frame 2: blue, 100 ms
gif.push(...buildFrame(WIDTH, HEIGHT, BLUE_PIXELS, 10, NUM_COLORS));
// Frame 3: blue, 150 ms  (adjacent duplicate of frame 2)
gif.push(...buildFrame(WIDTH, HEIGHT, BLUE_PIXELS, 15, NUM_COLORS));

// Trailer
gif.push(0x3b);

const outPath = join(__dirname, "dedup-selection.gif");
writeFileSync(outPath, Buffer.from(gif));
console.log(`Written ${gif.length} bytes → ${outPath}`);
