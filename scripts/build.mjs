/**
 * Release build: stage the runtime files into dist/ and package them as a
 * standard ZIP plus a SHA-256 checksum file, ready to upload to GitHub.
 *
 * Run:  node scripts/build.mjs           (or `npm run build`)
 *
 * Outputs:
 *   dist/deepseek-harness-launcher-v<version>/
 *   dist/deepseek-harness-launcher-v<version>.zip
 *   dist/deepseek-harness-launcher-v<version>.zip.sha256
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareIcons } from './prepare-icons.mjs';
import { createZip } from './zip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VERSION = pkg.version;
const STAGE_NAME = `deepseek-harness-launcher-v${VERSION}`;

/** Top-level entries shipped in the release archive. */
const SHIP = [
  'bin',
  'src',
  'assets',
  'start.cmd',
  'stop.cmd',
  'config.example.json',
  'README.md',
  'README.en.md',
  'LICENSE',
  'CHANGELOG.md',
  'package.json',
];

function collectFiles(base, prefix) {
  const files = [];
  const stat = fs.statSync(base);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(base)) {
      files.push(...collectFiles(path.join(base, entry), `${prefix}${entry}/`));
    }
  } else {
    files.push({ source: base, name: prefix.slice(0, -1) });
  }
  return files;
}

export function build() {
  // 1. Icons: validate the canonical ICO and extract the 256px PNG.
  prepareIcons();

  // 2. Stage.
  const stageDir = path.join(DIST, STAGE_NAME);
  fs.rmSync(stageDir, { recursive: true, force: true });
  fs.mkdirSync(stageDir, { recursive: true });

  const entries = [];
  for (const item of SHIP) {
    const source = path.join(ROOT, item);
    if (!fs.existsSync(source)) {
      throw new Error(`missing shipped file: ${item}`);
    }
    const stat = fs.statSync(source);
    const files = stat.isDirectory()
      ? collectFiles(source, `${item}/`)
      : [{ source, name: item }];
    for (const f of files) {
      entries.push({
        name: `${STAGE_NAME}/${f.name}`,
        data: fs.readFileSync(f.source),
      });
      fs.mkdirSync(path.dirname(path.join(stageDir, f.name)), { recursive: true });
      fs.copyFileSync(f.source, path.join(stageDir, f.name));
    }
  }

  // 3. Zip + checksum.
  const zip = createZip(entries);
  const zipPath = path.join(DIST, `${STAGE_NAME}.zip`);
  const sumPath = `${zipPath}.sha256`;
  fs.writeFileSync(zipPath, zip);
  const digest = createHash('sha256').update(zip).digest('hex');
  fs.writeFileSync(sumPath, `${digest}  ${path.basename(zipPath)}\n`);

  return { stageDir, zipPath, sumPath, entries: entries.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = build();
  console.log(`Release build v${VERSION} (${result.entries} files):`);
  console.log(`  ${path.relative(ROOT, result.stageDir)}/`);
  console.log(`  ${path.relative(ROOT, result.zipPath)}`);
  console.log(`  ${path.relative(ROOT, result.sumPath)}`);
}
