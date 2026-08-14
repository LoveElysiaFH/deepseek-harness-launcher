import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { findCheckout, findOnPath, looksLikeCheckout, resolveRunner } from '../src/detect.mjs';

function makeCheckout(extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-detect-'));
  // The real harness root package is "@deepseek-ai/dsh-root".
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-root' }));
  for (const [rel, content] of Object.entries(extra)) {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content ?? '');
  }
  return dir;
}

test('looksLikeCheckout recognises the harness package name, not lookalikes', () => {
  const dir = makeCheckout();
  try {
    assert.equal(looksLikeCheckout(dir), true);
    assert.equal(looksLikeCheckout(path.join(dir, 'missing')), false);

    // This project's own package name must never self-match.
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'deepseek-harness-launcher' }),
    );
    assert.equal(looksLikeCheckout(dir), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('findCheckout prefers the explicit hint', () => {
  const dir = makeCheckout();
  try {
    assert.equal(findCheckout(dir), path.resolve(dir));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('findOnPath resolves an executable in PATH', () => {
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-bin-'));
  const oldPath = process.env.PATH;
  try {
    fs.writeFileSync(path.join(binDir, 'dsh.cmd'), '@echo off\r\n');
    fs.writeFileSync(path.join(binDir, 'dsh'), '#!/bin/sh\n');
    fs.chmodSync(path.join(binDir, 'dsh'), 0o755);
    process.env.PATH = `${binDir}${path.delimiter}${oldPath}`;
    const found = findOnPath('dsh');
    assert.ok(found, 'dsh not found on PATH');
    assert.ok(found.startsWith(binDir), `unexpected location: ${found}`);
  } finally {
    process.env.PATH = oldPath;
    fs.rmSync(binDir, { recursive: true, force: true });
  }
});

test('resolveRunner picks source-cli for a built checkout', () => {
  const dir = makeCheckout({
    'apps/cli/lib/bin.js': '#!/usr/bin/env node\n',
    'apps/web/dist/index.html': '<html></html>',
  });
  const oldPath = process.env.PATH;
  try {
    // Remove any real dsh from PATH so detection falls through to the checkout.
    process.env.PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-empty-'));
    const cfg = { harness: { command: null, cwd: dir, args: ['web'], port: 3080 } };
    const runner = resolveRunner(cfg);
    assert.ok(runner, 'no runner resolved');
    assert.equal(runner.kind, 'source-cli');
    assert.equal(runner.command, process.execPath);
    assert.ok(runner.args.includes('web'));
    assert.equal(runner.cwd, dir);
    assert.equal(runner.needsBuild, false);
  } finally {
    process.env.PATH = oldPath;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveRunner reports needsBuild for an unbuilt checkout', () => {
  const dir = makeCheckout({ 'apps/cli/lib/bin.js': '#!/usr/bin/env node\n' });
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-empty-'));
    const runner = resolveRunner({ harness: { command: null, cwd: dir, args: ['web'], port: 3080 } });
    assert.ok(runner);
    assert.equal(runner.needsBuild, true);
  } finally {
    process.env.PATH = oldPath;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveRunner uses an explicit command verbatim', () => {
  const runner = resolveRunner({
    harness: { command: ['node', 'server.js'], cwd: null, args: ['web'], port: 3080 },
  });
  assert.ok(runner);
  assert.equal(runner.kind, 'custom');
  assert.equal(runner.command, 'node');
  assert.deepEqual(runner.args, ['server.js']);
});

test('resolveRunner passes --port when a non-default port is configured', () => {
  const dir = makeCheckout({
    'apps/cli/lib/bin.js': '#!/usr/bin/env node\n',
    'apps/web/dist/index.html': '<html></html>',
  });
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-empty-'));
    const runner = resolveRunner({ harness: { command: null, cwd: dir, args: ['web'], port: 3099 } });
    assert.ok(runner);
    assert.deepEqual(runner.args.slice(-2), ['--port', '3099']);
  } finally {
    process.env.PATH = oldPath;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
