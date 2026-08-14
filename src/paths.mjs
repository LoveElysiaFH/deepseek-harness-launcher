/**
 * Paths for the launcher's own state, kept in the user home so the release
 * ZIP stays read-only portable:
 *
 *   ~/.dsh-launcher/            launcher home (override: DSH_LAUNCHER_HOME)
 *   ~/.dsh-launcher/config.json user configuration
 *   ~/.dsh-launcher/run/        pid file + dsh web log
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAUNCHER_HOME = process.env.DSH_LAUNCHER_HOME
  ? path.resolve(process.env.DSH_LAUNCHER_HOME)
  : path.join(os.homedir(), '.dsh-launcher');

export const RUN_DIR = path.join(LAUNCHER_HOME, 'run');
export const PID_FILE = path.join(RUN_DIR, 'web.pid');
export const LOG_FILE = path.join(RUN_DIR, 'web.log');
export const LAST_ERROR_FILE = path.join(RUN_DIR, 'last-error.log');
export const CONFIG_FILE = path.join(LAUNCHER_HOME, 'config.json');

/** Directory containing this launcher installation (repo root or ZIP root). */
export function launcherRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

export function ensureRunDir() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
}
