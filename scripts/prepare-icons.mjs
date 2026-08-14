/**
 * Prepare the launcher icons from the canonical source:
 *
 *   assets/deepseek-whale-black.ico   (user-provided, black whale, source of truth)
 *     -> assets/whale-black.png       (256px frame extracted losslessly,
 *                                       used for the Linux .desktop entry and
 *                                       the README preview)
 *
 * The .ico contains PNG-compressed frames, so extraction is a byte-exact copy;
 * every frame is zlib-inflated once to prove it is not corrupted.
 *
 * Run:  node scripts/prepare-icons.mjs        (or `npm run icon`)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'assets');

export const CANONICAL_ICO = path.join(ASSETS, 'deepseek-whale-black.ico');
export const OUTPUT_PNG = path.join(ASSETS, 'whale-black.png');

/** Sizes a release icon should carry. */
export const REQUIRED_SIZES = [16, 32, 48, 256];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Parse an ICO container into `{ width, height, buf }[]` entries.
 */
export function parseICO(buf) {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    throw new Error('not a valid ICO file');
  }
  const count = buf.readUInt16LE(4);
  if (6 + count * 16 > buf.length) throw new Error('truncated ICO directory');
  const entries = [];
  for (let i = 0; i < count; i++) {
    const e = 6 + i * 16;
    const width = buf[e] === 0 ? 256 : buf[e];
    const height = buf[e + 1] === 0 ? 256 : buf[e + 1];
    const size = buf.readUInt32LE(e + 8);
    const offset = buf.readUInt32LE(e + 12);
    if (offset + size > buf.length) throw new Error(`truncated ICO entry ${i}`);
    entries.push({ width, height, size, offset, buf: buf.subarray(offset, offset + size) });
  }
  return entries;
}

/**
 * Verify that the frame is a PNG and that its compressed data inflates
 * (a cheap corruption check without a full decode).
 */
export function verifyPngFrame(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return false;
  let pos = 8;
  let sawIDAT = false;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') sawIDAT = true;
    pos += 12 + len;
  }
  if (!sawIDAT) return false;
  // Reinflate the IDAT stream to prove integrity.
  const idat = [];
  pos = 8;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  zlib.inflateSync(Buffer.concat(idat));
  return true;
}

/**
 * Validate the canonical ICO and return its entries.
 */
export function validateIcons(entries) {
  if (entries.length < REQUIRED_SIZES.length) {
    throw new Error(`icon has ${entries.length} frames, expected at least ${REQUIRED_SIZES.length}`);
  }
  for (const size of REQUIRED_SIZES) {
    if (!entries.some((e) => e.width === size && e.height === size)) {
      throw new Error(`icon is missing the ${size}x${size} frame`);
    }
  }
  for (const [i, e] of entries.entries()) {
    if (!verifyPngFrame(e.buf)) throw new Error(`frame ${i} (${e.width}x${e.height}) is not a valid PNG`);
  }
  return entries;
}

/** Return the PNG frame of the given size. */
export function extractFrame(entries, size) {
  const entry = entries.find((e) => e.width === size && e.height === size);
  if (!entry) throw new Error(`no ${size}x${size} frame in icon`);
  return entry.buf;
}

/** Run the full prepare step: validate + extract. */
export function prepareIcons() {
  const entries = validateIcons(parseICO(readFileSync(CANONICAL_ICO)));
  writeFileSync(OUTPUT_PNG, extractFrame(entries, 256));
  return entries;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const entries = prepareIcons();
  console.log(`Icons prepared from ${path.basename(CANONICAL_ICO)}:`);
  for (const e of entries) console.log(`  ${e.width}x${e.height} (${e.size} bytes, PNG)`);
  console.log(`  -> ${path.relative(ROOT, OUTPUT_PNG)} (256x256 frame)`);
}
