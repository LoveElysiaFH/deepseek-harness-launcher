/**
 * Configuration handling.
 *
 * Precedence (highest first): CLI flags > environment variables >
 * ~/.dsh-launcher/config.json > built-in defaults.
 *
 * Stored shape (see config.example.json):
 *   harness.command      explicit command override (string or array)
 *   harness.cwd          harness checkout directory hint
 *   harness.env          extra environment variables for the dsh process
 *   harness.args         args appended to the detected dsh command
 *   harness.port         dsh web port (default 3080)
 *   harness.url          web UI URL (null -> http://127.0.0.1:<port>)
 *   harness.timeoutSec   startup wait timeout (default 90)
 *   harness.openBrowser  open the browser after startup (default true)
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_FILE } from './paths.mjs';

export const DEFAULTS = Object.freeze({
  harness: {
    command: null,
    cwd: null,
    env: {},
    args: ['web'],
    port: 3080,
    url: null,
    timeoutSec: 90,
    openBrowser: true,
    restartOnRerun: false,
    console: false,
  },
});

/** Deep-merge plain objects (arrays and scalars are replaced). */
export function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  if (typeof over !== 'object' || Array.isArray(over)) return over;
  for (const [key, value] of Object.entries(over)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? deepMerge(base?.[key] ?? {}, value)
      : value;
  }
  return out;
}

export function readConfigFile() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    const wrapped = new Error(`invalid config ${CONFIG_FILE}: ${err.message}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

export function saveConfigFile(config) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function envOverrides() {
  const out = { harness: {} };
  const h = out.harness;
  if (process.env.DSH_LAUNCHER_HARNESS) h.cwd = process.env.DSH_LAUNCHER_HARNESS;
  if (process.env.DSH_LAUNCHER_PORT && Number.isFinite(Number(process.env.DSH_LAUNCHER_PORT))) {
    h.port = Number(process.env.DSH_LAUNCHER_PORT);
  }
  if (process.env.DSH_LAUNCHER_URL) h.url = process.env.DSH_LAUNCHER_URL;
  if (process.env.DSH_LAUNCHER_TIMEOUT && Number.isFinite(Number(process.env.DSH_LAUNCHER_TIMEOUT))) {
    h.timeoutSec = Number(process.env.DSH_LAUNCHER_TIMEOUT);
  }
  if (process.env.DSH_LAUNCHER_NO_BROWSER === '1') h.openBrowser = false;
  return out;
}

/**
 * Load the effective configuration.
 * `cli`: `{ port, url, timeout, noBrowser, cwd, command }` (from flags).
 */
export function loadConfig(cli = {}) {
  const merged = deepMerge(
    deepMerge(DEFAULTS, readConfigFile()),
    envOverrides(),
  );
  const h = merged.harness;
  if (cli.port !== undefined) h.port = cli.port;
  if (cli.url !== undefined) h.url = cli.url;
  if (cli.timeout !== undefined) h.timeoutSec = cli.timeout;
  if (cli.noBrowser) h.openBrowser = false;
  if (cli.restart) h.restartOnRerun = true;
  if (cli.cwd !== undefined) h.cwd = cli.cwd || null;
  if (cli.command !== undefined) h.command = cli.command || null;

  // Effective URL derived from the port when not configured explicitly.
  merged.effectiveUrl = h.url ?? `http://127.0.0.1:${h.port}`;
  merged.effectivePort = h.port;
  // Console mode: enabled via persisted `harness.console` or the one-off
  // `--console` flag; either one runs dsh in a visible console.
  merged.consoleMode = resolveConsoleMode(h.console, cli.console);
  return merged;
}

/** Console mode is on when either the persisted config or the CLI flag says so. */
export function resolveConsoleMode(harnessConsole, cliConsole) {
  return harnessConsole === true || cliConsole === true;
}

/** Read a dotted path ("harness.port") from a plain object. */
export function getByPath(obj, keyPath) {  return keyPath.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, obj);
}

/** Write a dotted path into a plain object, creating intermediate objects. */
export function setByPath(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof target[keys[i]] !== 'object' || target[keys[i]] === null) target[keys[i]] = {};
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
  return obj;
}

/** Coerce a CLI-provided string into boolean / number / string. */
export function coerceValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (raw !== '' && Number.isFinite(Number(raw))) return Number(raw);
  return raw;
}
