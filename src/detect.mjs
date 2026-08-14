/**
 * Harness detection.
 *
 * The launcher never installs or downloads the harness; it locates an
 * existing installation and produces a concrete spawn command:
 *
 *   1. explicit `harness.command` from config / --command
 *   2. `dsh` on PATH (npm install -g @deepseek-ai/dsh, or local bin link)
 *   3. a source checkout (searched in ~, next to the launcher, and any
 *      `harness.cwd` hint): prefers the built CLI entry
 *      `apps/cli/lib/bin.js`, then `pnpm dsh web`, then `npx dsh web`
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launcherRoot } from './paths.mjs';

const WINDOWS = process.platform === 'win32';

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Find an executable named `bin` on PATH.
 * Returns the full path (including extension on Windows) or null.
 */
export function findOnPath(bin) {
  const pathEnv = process.env.PATH ?? '';
  const exts = WINDOWS
    ? ['', ...(process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').map((e) => e.toLowerCase())]
    : [''];
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = path.join(dir, `${bin}${ext}`);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

/** Does `dir` look like a deepseek-harness checkout? */
export function looksLikeCheckout(dir) {
  try {
    if (!dir || !fs.statSync(dir).isDirectory()) return false;
    const pkgPath = path.join(dir, 'package.json');
    if (isFile(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const name = pkg.name ?? '';
      // The harness root package is "@deepseek-ai/dsh-root"; accept other
      // @deepseek-ai/dsh* roots and a bare "deepseek-harness" name. Deliberately
      // NOT "deepseek-harness-launcher" (this project) or similar wrappers.
      if (/^@deepseek-ai\/dsh(-|$)/.test(name) || name === 'deepseek-harness') return true;
    }
    if (isFile(path.join(dir, 'apps', 'cli', 'lib', 'bin.js'))) return true;
    if (isFile(path.join(dir, 'node_modules', '.bin', WINDOWS ? 'dsh.cmd' : 'dsh'))) return true;
  } catch {
    /* not a checkout */
  }
  return false;
}

/** Search candidate locations for a harness checkout. */
export function findCheckout(explicit) {
  const candidates = [];
  const push = (...dirs) => candidates.push(...dirs.map((d) => (d ? path.resolve(d) : d)));

  push(explicit);
  const root = launcherRoot();
  const home = os.homedir();
  push(
    path.join(home, 'deepseek-harness'),
    path.join(home, 'deepseek-harness-master'),
    path.join(root, 'deepseek-harness'),
    path.join(root, 'deepseek-harness-master'),
  );

  // Walk up the directory tree (up to 6 levels) so the launcher also finds
  // checkouts that live next to one of its ancestor directories — enough to
  // cover the launcher being nested inside dist/<version>/ folders.
  const ancestors = [];
  let cursor = path.dirname(root);
  for (let i = 0; i < 6 && cursor && cursor !== path.dirname(cursor); i++) {
    ancestors.push(cursor);
    cursor = path.dirname(cursor);
  }
  for (const ancestor of ancestors) {
    push(path.join(ancestor, 'deepseek-harness'), path.join(ancestor, 'deepseek-harness-master'));
  }

  // Shallow scan of the home directory and every ancestor directory for
  // folders named deepseek-harness*.
  for (const scanDir of [home, ...ancestors]) {
    try {
      for (const entry of fs.readdirSync(scanDir, { withFileTypes: true })) {
        if (entry.isDirectory() && /^deepseek[-_\s]*harness/i.test(entry.name)) {
          candidates.push(path.join(scanDir, entry.name));
        }
      }
    } catch {
      /* unreadable dir */
    }
  }

  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = path.resolve(candidate);
    if (normalized === launcherRoot()) continue; // never self-detect
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (looksLikeCheckout(normalized)) return normalized;
  }
  return null;
}

/**
 * Build the concrete command that starts "dsh web".
 * Returns `{ kind, command, args, cwd, shell, hint, needsBuild }` or null.
 */
export function resolveRunner(cfg) {
  const h = cfg.harness;
  const extra = h.port !== 3080 ? ['--port', String(h.port)] : [];

  // 1. Explicit command: used verbatim (args and port flags are the
  //    user's responsibility).
  if (h.command) {
    const parts = Array.isArray(h.command) ? h.command : [h.command];
    return {
      kind: 'custom',
      command: parts[0],
      args: parts.slice(1),
      cwd: h.cwd ?? launcherRoot(),
      shell: WINDOWS,
      hint: 'harness.command',
      needsBuild: false,
    };
  }

  // 2. dsh on PATH.
  const onPath = findOnPath('dsh');
  if (onPath) {
    return {
      kind: 'dsh',
      command: onPath,
      args: [...h.args, ...extra],
      cwd: h.cwd ?? launcherRoot(),
      shell: WINDOWS && /\.(cmd|bat)$/i.test(onPath),
      hint: onPath,
      needsBuild: false,
    };
  }

  // 3. Source checkout.
  const checkout = findCheckout(h.cwd);
  if (checkout) {
    const distIndex = path.join(checkout, 'apps', 'web', 'dist', 'index.html');
    const cliEntry = path.join(checkout, 'apps', 'cli', 'lib', 'bin.js');
    const needsBuild = !isFile(distIndex);
    if (isFile(cliEntry)) {
      return {
        kind: 'source-cli',
        command: process.execPath,
        args: [cliEntry, ...h.args, ...extra],
        cwd: checkout,
        shell: false,
        hint: cliEntry,
        needsBuild,
      };
    }
    if (findOnPath('pnpm')) {
      return {
        kind: 'source-pnpm',
        command: 'pnpm',
        args: ['dsh', ...h.args, ...extra],
        cwd: checkout,
        shell: WINDOWS,
        hint: checkout,
        needsBuild,
      };
    }
    if (findOnPath('npx')) {
      return {
        kind: 'source-npx',
        command: 'npx',
        args: ['dsh', ...h.args, ...extra],
        cwd: checkout,
        shell: WINDOWS,
        hint: checkout,
        needsBuild,
      };
    }
    return null; // checkout found but unusable: no CLI, no pnpm/npx
  }

  return null;
}
