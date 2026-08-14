import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import {
  CANONICAL_ICO,
  extractFrame,
  OUTPUT_PNG,
  parseICO,
  REQUIRED_SIZES,
  validateIcons,
} from '../scripts/prepare-icons.mjs';
import { decodePNG } from './helpers.mjs';

const ico = fs.readFileSync(CANONICAL_ICO);

test('canonical icon exists and parses as an ICO container', () => {
  assert.ok(fs.existsSync(CANONICAL_ICO), 'assets/deepseek-whale-black.ico missing');
  const entries = parseICO(ico);
  assert.ok(entries.length >= REQUIRED_SIZES.length, `only ${entries.length} frames`);
  for (const size of REQUIRED_SIZES) {
    assert.ok(
      entries.some((e) => e.width === size && e.height === size),
      `missing ${size}x${size} frame`,
    );
  }
  for (const e of entries) {
    assert.equal(e.buf.length, e.size, 'frame buffer length mismatch');
  }
});

test('every frame is an intact PNG (zlib round-trip check)', () => {
  const entries = parseICO(ico);
  assert.doesNotThrow(() => validateIcons(entries));
});

test('extracted 256px PNG is byte-identical to the embedded frame', () => {
  const entries = parseICO(ico);
  const frame = entries.find((e) => e.width === 256 && e.height === 256);
  assert.ok(frame, 'no 256px frame');
  assert.ok(extractFrame(entries, 256).equals(frame.buf));
  assert.ok(fs.existsSync(OUTPUT_PNG), 'assets/whale-black.png not generated; run npm run icon');
  assert.ok(fs.readFileSync(OUTPUT_PNG).equals(frame.buf), 'whale-black.png differs from embedded frame');
});

test('whale icon is predominantly black with transparent background', () => {
  const img = decodePNG(fs.readFileSync(OUTPUT_PNG));
  assert.equal(img.width, 256);
  assert.equal(img.height, 256);
  assert.equal(img.channels, 4);
  let opaque = 0;
  let black = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const alpha = img.data[i + 3];
    if (alpha > 128) {
      opaque++;
      if (img.data[i] < 128 && img.data[i + 1] < 128 && img.data[i + 2] < 128) black++;
    }
  }
  const total = 256 * 256;
  assert.ok(opaque > 0.25 * total, `whale covers too little area: ${opaque}/${total}`);
  assert.ok(opaque < 0.9 * total, `whale covers too much area: ${opaque}/${total}`);
  assert.ok(black / opaque > 0.9, `icon is not predominantly black: ${(black / opaque).toFixed(3)}`);
});
