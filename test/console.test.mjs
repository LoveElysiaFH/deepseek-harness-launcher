import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../src/config.mjs';

test('--console flag enables console mode; it is off by default', () => {
  assert.equal(loadConfig({ console: true }).consoleMode, true);
  assert.equal(loadConfig({}).consoleMode, false);
});

test('console mode is not affected by the persisted config (one-off flag)', () => {
  // consoleMode is computed only from the CLI flag, never from config file/env.
  assert.equal(loadConfig({ port: 3080 }).consoleMode, false);
  assert.equal(loadConfig({ console: true, restart: true }).consoleMode, true);
});
