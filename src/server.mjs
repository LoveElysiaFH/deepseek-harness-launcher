/**
 * dsh web process management: probe, start, stop, status.
 *
 * The spawned process is detached and hidden; its output goes to
 * ~/.dsh-launcher/run/web.log and its pid to ~/.dsh-launcher/run/web.pid.
 * `stop` only ever kills the pid recorded in the pid file, so a harness
 * instance started elsewhere (e.g. manually) is never touched.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { ensureRunDir, LOG_FILE, PID_FILE } from './paths.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** True if a TCP port accepts connections (does not prove dsh owns it). */
export function portOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 400 });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

/** True if `url` answers HTTP (any response status counts as "serving"). */
export function serving(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

export function readPid() {
  try {
    const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

export function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decide what `start` should do when the web UI is already serving.
 * `managed` means the running instance was started by this launcher (pid file).
 * Returns `'restart'` (kill + respawn), `'open'` (just open the browser) or
 * `'fresh'` (nothing is serving).
 */
export function planRestart({ serving: isServing, managed, restartOnRerun }) {
  if (!isServing) return 'fresh';
  if (restartOnRerun && managed) return 'restart';
  return 'open';
}

function killPid(pid) {
  if (WINDOWS()) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-pid, 'SIGTERM'); // detached child = its own process group
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* already gone */
      }
    }
  }
}

const WINDOWS = () => process.platform === 'win32';

/** Append the last few lines of the log to a message. */
export function logTail(maxLines = 8) {
  try {
    const text = fs.readFileSync(LOG_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
    return text.slice(-maxLines).join('\n');
  } catch {
    return '';
  }
}

/**
 * Start "dsh web" if the web UI is not already serving, then open the
 * browser. Returns `{ alreadyRunning }` or `{ started, pid }`.
 */
export async function start(cfg, runner, t, log = console.log) {
  ensureRunDir();
  const url = cfg.effectiveUrl;
  const parsed = new URL(url);

  if (await serving(url)) {
    const pid = readPid();
    const managed = pid !== null && isPidAlive(pid);
    const action = planRestart({
      serving: true,
      managed,
      restartOnRerun: cfg.harness.restartOnRerun,
    });
    if (action === 'restart') {
      log(t('server.restarting', { url, pid }));
      killPid(pid);
      fs.rmSync(PID_FILE, { force: true });
      // Wait for the port to actually free up before respawning.
      const freeDeadline = Date.now() + 15000;
      while (await portOpen(parsed.hostname, Number(parsed.port)) && Date.now() < freeDeadline) {
        await sleep(300);
      }
      // Fall through to spawn a fresh instance below.
    } else {
      log(cfg.harness.restartOnRerun
        ? t('server.restartSkipped', { url })
        : t('server.already', { url }));
      if (cfg.harness.openBrowser) openBrowser(url, t, log);
      return { alreadyRunning: true };
    }
  }
  if (await portOpen(parsed.hostname, Number(parsed.port))) {
    throw new Error(t('server.portBusy', { port: parsed.port }));
  }

  const commandLine = [runner.command, ...runner.args].join(' ');
  log(t('server.starting', { command: commandLine, log: LOG_FILE }));
  if (runner.needsBuild) log(t('server.needsBuild'));

  const fd = fs.openSync(LOG_FILE, 'a');
  let child;
  try {
    child = spawn(runner.command, runner.args, {
      cwd: runner.cwd,
      shell: runner.shell,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', fd, fd],
      env: { ...process.env, ...(cfg.harness.env ?? {}) },
    });
  } catch (err) {
    fs.closeSync(fd);
    throw new Error(`${err.message}\ncommand: ${commandLine}`);
  }
  fs.closeSync(fd);
  fs.writeFileSync(PID_FILE, `${child.pid}\n`);
  child.unref();

  const startedAt = Date.now();
  const deadline = startedAt + cfg.harness.timeoutSec * 1000;
  let exitCode = null;
  child.on('exit', (code) => {
    exitCode = code;
  });

  while (Date.now() < deadline) {
    if (exitCode !== null) {
      throw new Error(
        `${t('server.exited', { code: exitCode, log: LOG_FILE })}\n${logTail()}`,
      );
    }
    if (await serving(url)) {
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      log(t('server.ready', { url, seconds }));
      if (cfg.harness.openBrowser) openBrowser(url, t, log);
      return { started: true, pid: child.pid };
    }
    await sleep(500);
  }

  throw Object.assign(
    new Error(`${t('server.timeout', { seconds: cfg.harness.timeoutSec, log: LOG_FILE })}\n${logTail()}`),
    { exitCode: 4 },
  );
}

/** Stop the instance started by this launcher (pid file only). */
export async function stop(cfg, t, log = console.log) {
  const pid = readPid();
  if (!pid) {
    log(t('server.noPid'));
    return { stopped: false };
  }
  if (isPidAlive(pid)) killPid(pid);
  await sleep(700);
  fs.rmSync(PID_FILE, { force: true });
  if (await serving(cfg.effectiveUrl)) {
    log(t('server.stillServing', { url: cfg.effectiveUrl }));
  } else {
    log(t('server.stopped', { pid }));
  }
  return { stopped: true, pid };
}

/** Report the current state; `{ running, pid, startedByLauncher }`. */
export async function status(cfg) {
  const url = cfg.effectiveUrl;
  const pid = readPid();
  const up = await serving(url);
  return {
    url,
    running: up,
    pid,
    startedByLauncher: pid !== null && isPidAlive(pid),
    log: LOG_FILE,
  };
}

/** Open the default browser, best effort. */
export function openBrowser(url, t, log = console.log) {
  try {
    if (WINDOWS()) {
      spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
    log(t('server.browserOpened', { url }));
  } catch {
    log(t('server.browserFailed', { url }));
  }
}
