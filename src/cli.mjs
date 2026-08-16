/**
 * Command-line interface: argument parsing and command dispatch.
 *
 * Exit codes: 0 ok, 1 generic error, 2 usage error, 3 harness not found,
 * 4 startup timeout.
 */
import fs from 'node:fs';
import { coerceValue, getByPath, loadConfig, readConfigFile, saveConfigFile, setByPath } from './config.mjs';
import { findCheckout, findOnPath, resolveRunner } from './detect.mjs';
import { makeT } from './i18n.mjs';
import { CONFIG_FILE, ensureRunDir, LAST_ERROR_FILE, launcherRoot, LAUNCHER_HOME } from './paths.mjs';
import * as server from './server.mjs';
import { installShortcut, shortcutExists, shortcutPath, uninstallShortcut } from './shortcut.mjs';

const VERSION = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;

const VALUE_FLAGS = new Set(['--port', '--url', '--timeout', '--cwd', '--command', '--lang']);
const BOOL_FLAGS = new Set(['--no-browser', '--restart', '--console', '--force', '--json']);

function parseArgs(argv) {
  const opts = { lang: 'auto' };
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (VALUE_FLAGS.has(token)) {
      const value = argv[++i];
      if (value === undefined) throw usageError(`missing value for ${token}`);
      const key = token.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      opts[key] = value;
      continue;
    }
    if (BOOL_FLAGS.has(token)) {
      const key = token.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      opts[key] = true;
      continue;
    }
    if (token === '-h' || token === '--help') opts.help = true;
    else if (token === '-v' || token === '--version') opts.version = true;
    else if (token.startsWith('-')) throw usageError(`unknown option ${token}`);
    else positionals.push(token);
  }
  const command = positionals.shift() ?? (opts.help ? 'help' : opts.version ? 'version' : 'help');
  return { command, positionals, opts };
}

function usageError(message) {
  const err = new Error(message);
  err.exitCode = 2;
  return err;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdStart(opts, t) {
  const cfg = loadConfig({
    port: toNumber(opts.port),
    url: opts.url,
    timeout: toNumber(opts.timeout),
    noBrowser: opts.noBrowser,
    restart: opts.restart,
    console: opts.console,
    cwd: opts.cwd,
    command: opts.command,
  });
  const runner = resolveRunner(cfg);
  if (!runner) {
    const err = new Error(t('detect.notFound'));
    err.exitCode = 3;
    throw err;
  }
  console.log(t('detect.using', { kind: runner.kind, hint: runner.hint }));
  await server.start(cfg, runner, t);
}

async function cmdStop(opts, t) {
  const cfg = loadConfig({ port: toNumber(opts.port), url: opts.url });
  await server.stop(cfg, t);
}

async function cmdStatus(opts, t) {
  const cfg = loadConfig({ port: toNumber(opts.port), url: opts.url });
  const s = await server.status(cfg);
  if (opts.json) {
    console.log(JSON.stringify(s, null, 2));
    return;
  }
  if (s.running) {
    console.log(s.startedByLauncher
      ? t('status.running', { url: s.url, pid: s.pid })
      : t('status.runningNoPid', { url: s.url }));
  } else if (s.pid) {
    console.log(t('status.stalePid', { url: s.url, pid: s.pid }));
  } else {
    console.log(t('status.stopped', { url: s.url }));
  }
  console.log(t('status.log', { log: s.log }));
}

function cmdInstall(opts, t) {
  const cfg = loadConfig();
  installShortcut({ force: opts.force, consoleMode: cfg.harness.console === true, t });
}

function cmdUninstall(opts, t) {
  uninstallShortcut({ t });
}

function cmdDoctor(opts, t) {
  const cfg = loadConfig({ port: toNumber(opts.port) });
  const root = launcherRoot();
  const dshPath = findOnPath('dsh');
  const checkout = findCheckout(cfg.harness.cwd);
  const iconPath = `${root}/assets/deepseek-whale-black.ico`;

  console.log(t('doctor.node', { version: process.version }));
  console.log(t('doctor.platform', { platform: `${process.platform} ${process.arch}` }));
  console.log(t('doctor.root', { root }));
  console.log(t('doctor.home', { home: LAUNCHER_HOME }));
  console.log(dshPath ? t('doctor.dshPath', { path: dshPath }) : t('doctor.dshNone'));
  console.log(checkout ? t('doctor.checkout', { path: checkout }) : t('doctor.checkoutNone'));

  const pid = server.readPid();
  if (pid !== null) {
    console.log(t('doctor.pid', { pid: `${pid}${server.isPidAlive(pid) ? ' (alive)' : ' (stale)'}` }));
  } else {
    console.log(t('doctor.pidNone'));
  }

  const shortcutPathValue = shortcutPath();
  console.log(shortcutExists()
    ? t('doctor.shortcut', { path: shortcutPathValue })
    : t('doctor.shortcutNone'));

  console.log(fs.existsSync(iconPath) ? t('doctor.icon', { path: iconPath }) : t('doctor.iconNone'));
  console.log(fs.existsSync(CONFIG_FILE)
    ? t('doctor.configFile', { path: CONFIG_FILE })
    : t('doctor.configNone'));

  // Serving state (async probe).
  server.serving(cfg.effectiveUrl).then((up) => {
    console.log(up ? t('doctor.portServing', { url: cfg.effectiveUrl }) : t('doctor.portFree', { url: cfg.effectiveUrl }));
    if (!up && dshPath === null && checkout === null) {
      console.log(t('detect.notFound'));
    }
  });
}

function cmdConfig(positionals, opts, t) {
  const sub = positionals[0];
  if (!sub) {
    const fileCfg = readConfigFile();
    const hasFile = Object.keys(fileCfg).length > 0;
    console.log(hasFile ? t('config.file', { path: CONFIG_FILE }) : t('config.fileMissing', { path: CONFIG_FILE }));
    console.log(JSON.stringify(hasFile ? fileCfg : { harness: { port: 3080 } }, null, 2));
    console.log(t('config.showHint'));
    return;
  }
  if (sub === 'get') {
    const key = positionals[1];
    if (!key) throw usageError(t('cli.missingValue', { flag: 'get <key>' }));
    const cfg = loadConfig();
    console.log(t('config.getResult', { key, value: JSON.stringify(getByPath(cfg, key) ?? null) }));
    return;
  }
  if (sub === 'set') {
    const key = positionals[1];
    const raw = positionals[2];
    if (!key || raw === undefined) throw usageError(t('cli.missingValue', { flag: 'set <key> <value>' }));
    if (!key.startsWith('harness.')) throw usageError(t('config.badRoot'));
    const fileCfg = Object.keys(readConfigFile()).length > 0 ? readConfigFile() : { harness: {} };
    setByPath(fileCfg, key, coerceValue(raw));
    saveConfigFile(fileCfg);
    console.log(t('config.saved', { path: CONFIG_FILE }));
    console.log(t('config.setDone', { key, value: JSON.stringify(coerceValue(raw)) }));
    return;
  }
  if (sub === 'reset') {
    fs.rmSync(CONFIG_FILE, { force: true });
    console.log(t('config.resetDone', { path: CONFIG_FILE }));
    return;
  }
  throw usageError(t('cli.unknownCommand', { command: `config ${sub}` }));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main(argv) {
  // Persist the last fatal error so the silent Windows launcher can show the
  // real reason in its message box (its console output is hidden).
  try {
    ensureRunDir();
    fs.rmSync(LAST_ERROR_FILE, { force: true });
  } catch {
    /* best effort */
  }

  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    console.error(err.message);
    console.error(makeT('auto')('cli.usage'));
    return err.exitCode ?? 2;
  }
  const t = makeT(parsed.opts.lang);

  try {
    switch (parsed.command) {
      case 'start':
        await cmdStart(parsed.opts, t);
        return 0;
      case 'stop':
        await cmdStop(parsed.opts, t);
        return 0;
      case 'status':
        await cmdStatus(parsed.opts, t);
        return 0;
      case 'install':
        cmdInstall(parsed.opts, t);
        return 0;
      case 'uninstall':
        cmdUninstall(parsed.opts, t);
        return 0;
      case 'doctor':
        cmdDoctor(parsed.opts, t);
        return 0;
      case 'config':
        cmdConfig(parsed.positionals, parsed.opts, t);
        return 0;
      case 'version':
        console.log(t('cli.version', { version: VERSION }));
        return 0;
      case 'help':
      default:
        console.log(t('cli.help'));
        return parsed.command === 'help' ? 0 : 2;
    }
  } catch (err) {
    const message = err.message ?? String(err);
    console.error(message);
    try {
      ensureRunDir();
      // UTF-16LE + BOM so the VBS silent launcher reads it natively (UTF-8
      // would be misread as the system ANSI codepage on non-ASCII Windows).
      fs.writeFileSync(LAST_ERROR_FILE, `\ufeff${message}\n`, 'utf16le');
    } catch {
      /* best effort */
    }
    return err.exitCode ?? 1;
  }
}
