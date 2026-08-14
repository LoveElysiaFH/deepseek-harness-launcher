import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import {
  buildICNS,
  CANONICAL_ICO,
  extractFrame,
  OUTPUT_ICNS,
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

test('icns container is assembled from the ICO PNG frames', () => {
  const entries = parseICO(ico);
  const icns = buildICNS(entries);
  assert.ok(icns, 'buildICNS returned null');
  assert.equal(icns.toString('ascii', 0, 4), 'icns', 'magic');
  assert.equal(icns.readUInt32BE(4), icns.length, 'total size field');

  // The 128px and 256px chunks must embed the exact PNG frames.
  for (const [size, type] of [[128, 'ic07'], [256, 'ic08']]) {
    const frame = entries.find((e) => e.width === size && e.height === size);
    let offset = 8;
    let found = false;
    while (offset + 8 <= icns.length) {
      const chunkType = icns.toString('ascii', offset, offset + 4);
      const chunkLen = icns.readUInt32BE(offset + 4);
      if (chunkType === type) {
        assert.ok(frame, `no ${size}px frame in ICO`);
        assert.ok(icns.subarray(offset + 8, offset + chunkLen).equals(frame.buf), `${type} must be a byte-exact copy`);
        found = true;
      }
      offset += chunkLen;
    }
    assert.ok(found, `missing ${type} chunk`);
  }

  // The committed icns must match a fresh build.
  assert.ok(fs.existsSync(OUTPUT_ICNS), 'assets/whale-black.icns not generated; run npm run icon');
  assert.ok(fs.readFileSync(OUTPUT_ICNS).equals(icns), 'whale-black.icns differs from a fresh build');
});
