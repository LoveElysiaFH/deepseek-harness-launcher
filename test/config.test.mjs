import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  coerceValue,
  deepMerge,
  getByPath,
  loadConfig,
  setByPath,
} from '../src/config.mjs';

test('deepMerge merges nested objects and replaces scalars/arrays', () => {
  const base = { harness: { port: 3080, args: ['web'], env: { a: 1 } } };
  const over = { harness: { port: 5000, args: ['web', '--port', '5000'], env: { b: 2 } } };
  const merged = deepMerge(base, over);
  assert.equal(merged.harness.port, 5000);
  assert.deepEqual(merged.harness.args, ['web', '--port', '5000']);
  assert.deepEqual(merged.harness.env, { a: 1, b: 2 }); // nested objects merge deep
});

test('getByPath / setByPath handle dotted keys', () => {
  const obj = {};
  setByPath(obj, 'harness.port', 3090);
  setByPath(obj, 'harness.env.FOO', 'bar');
  assert.equal(getByPath(obj, 'harness.port'), 3090);
  assert.equal(getByPath(obj, 'harness.env.FOO'), 'bar');
  assert.equal(getByPath(obj, 'harness.nope.deep'), undefined);
});

test('coerceValue parses booleans, numbers and null, keeps strings', () => {
  assert.equal(coerceValue('true'), true);
  assert.equal(coerceValue('false'), false);
  assert.equal(coerceValue('null'), null);
  assert.equal(coerceValue('3090'), 3090);
  assert.equal(coerceValue(''), '');
  assert.equal(coerceValue('dsh'), 'dsh');
});

test('env var overrides config file; CLI flags beat env', () => {
  const oldPort = process.env.DSH_LAUNCHER_PORT;
  const oldNoBrowser = process.env.DSH_LAUNCHER_NO_BROWSER;
  try {
    process.env.DSH_LAUNCHER_PORT = '4123';
    assert.equal(loadConfig().effectivePort, 4123);
    assert.equal(loadConfig().effectiveUrl, 'http://127.0.0.1:4123');
    assert.equal(loadConfig({ port: 5555 }).effectivePort, 5555, 'CLI must beat env');

    process.env.DSH_LAUNCHER_NO_BROWSER = '1';
    assert.equal(loadConfig().harness.openBrowser, false);
    delete process.env.DSH_LAUNCHER_NO_BROWSER;
    assert.equal(loadConfig().harness.openBrowser, true);

    assert.equal(
      loadConfig({ url: 'http://localhost:9999' }).effectiveUrl,
      'http://localhost:9999',
      'explicit url must win',
    );
  } finally {
    if (oldPort === undefined) delete process.env.DSH_LAUNCHER_PORT;
    else process.env.DSH_LAUNCHER_PORT = oldPort;
    if (oldNoBrowser === undefined) delete process.env.DSH_LAUNCHER_NO_BROWSER;
    else process.env.DSH_LAUNCHER_NO_BROWSER = oldNoBrowser;
  }
});
