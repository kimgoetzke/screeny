/**
 * Generates portrait.gif and landscape.gif for initial-fit E2E coverage.
 *
 * - landscape.gif: 12x4, one frame
 * - portrait.gif:  4x12, one frame
 *
 * Run to (re)generate the binary fixtures:
 *   node tests/fixtures/create-initial-fit-fixtures.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

class BitWriter {
  constructor() {
    this.bytes = [];
    this.current = 0;
    this.bitPosition = 0;
  }

  writeBits(value, bitCount) {
    for (let index = 0; index < bitCount; index++) {
      this.current |= ((value >> index) & 1) << this.bitPosition;
      this.bitPosition++;
      if (this.bitPosition === 8) {
        this.bytes.push(this.current);
        this.current = 0;
        this.bitPosition = 0;
      }
    }
  }

  flush() {
    if (this.bitPosition > 0) {
      this.bytes.push(this.current);
      this.current = 0;
      this.bitPosition = 0;
    }

    return Uint8Array.from(this.bytes);
  }
}

function lzwEncode(pixels, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const endOfInformationCode = clearCode + 1;
  const writer = new BitWriter();

  let codeSize = minCodeSize + 1;
  let nextCode = clearCode + 2;
  let dictionary = new Map();

  const resetDictionary = () => {
    dictionary = new Map();
    for (let index = 0; index < clearCode; index++) {
      dictionary.set(`${index}`, index);
    }
    codeSize = minCodeSize + 1;
    nextCode = clearCode + 2;
  };

  resetDictionary();
  writer.writeBits(clearCode, codeSize);

  let current = `${pixels[0]}`;

  for (let index = 1; index < pixels.length; index++) {
    const combined = `${current},${pixels[index]}`;
    if (dictionary.has(combined)) {
      current = combined;
      continue;
    }

    writer.writeBits(dictionary.get(current), codeSize);

    if (nextCode < 4096) {
      dictionary.set(combined, nextCode++);
      if (nextCode > (1 << codeSize) && codeSize < 12) {
        codeSize++;
      }
    } else {
      writer.writeBits(clearCode, codeSize);
      resetDictionary();
    }

    current = `${pixels[index]}`;
  }

  writer.writeBits(dictionary.get(current), codeSize);
  writer.writeBits(endOfInformationCode, codeSize);

  return writer.flush();
}

function packSubBlocks(data) {
  const blocks = [];
  let offset = 0;

  while (offset < data.length) {
    const blockSize = Math.min(255, data.length - offset);
    blocks.push(blockSize);
    for (let index = 0; index < blockSize; index++) {
      blocks.push(data[offset++]);
    }
  }

  blocks.push(0);
  return blocks;
}

function buildFrame(width, height, pixels, delay, colourCount) {
  const frame = [];
  const minCodeSize = Math.max(2, Math.ceil(Math.log2(colourCount)));

  frame.push(0x21, 0xf9);
  frame.push(4);
  frame.push(0);
  frame.push(delay & 0xff, (delay >> 8) & 0xff);
  frame.push(0);
  frame.push(0);

  frame.push(0x2c);
  frame.push(0, 0, 0, 0);
  frame.push(width & 0xff, (width >> 8) & 0xff);
  frame.push(height & 0xff, (height >> 8) & 0xff);
  frame.push(0);

  frame.push(minCodeSize);
  frame.push(...packSubBlocks(lzwEncode(pixels, minCodeSize)));

  return frame;
}

function buildGif(width, height, pixelIndex) {
  const palette = [
    [pixelIndex === 0 ? 255 : 0, pixelIndex === 1 ? 255 : 0, pixelIndex === 2 ? 255 : 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const pixels = new Array(width * height).fill(0);
  const gif = [];

  gif.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  gif.push(width & 0xff, (width >> 8) & 0xff);
  gif.push(height & 0xff, (height >> 8) & 0xff);
  gif.push(0b10010001);
  gif.push(0);
  gif.push(0);

  for (const [red, green, blue] of palette) {
    gif.push(red, green, blue);
  }

  gif.push(0x21, 0xff);
  gif.push(11);
  gif.push(...[0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]);
  gif.push(3);
  gif.push(1);
  gif.push(0, 0);
  gif.push(0);

  gif.push(...buildFrame(width, height, pixels, 10, palette.length));
  gif.push(0x3b);

  return Buffer.from(gif);
}

writeFileSync(join(__dirname, "landscape.gif"), buildGif(12, 4, 2));
writeFileSync(join(__dirname, "portrait.gif"), buildGif(4, 12, 1));
