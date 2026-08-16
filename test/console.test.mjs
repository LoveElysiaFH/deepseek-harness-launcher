import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULTS, loadConfig } from '../src/config.mjs';

test('--console flag enables console mode; it is off by default', () => {
  assert.equal(DEFAULTS.harness.console, false);
  assert.equal(loadConfig({ console: true }).consoleMode, true);
  assert.equal(loadConfig({}).consoleMode, false);
});

test('console mode is enabled by the --console flag regardless of other options', () => {
  // consoleMode is computed from persisted harness.console OR the --console flag.
  assert.equal(loadConfig({ port: 3080 }).consoleMode, false);
  assert.equal(loadConfig({ console: true, restart: true }).consoleMode, true);
});
