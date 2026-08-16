import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULTS, resolveConsoleMode } from '../src/config.mjs';

test('console mode is off by default in the config defaults', () => {
  assert.equal(DEFAULTS.harness.console, false);
});

test('resolveConsoleMode is the OR of persisted config and the CLI flag', () => {
  assert.equal(resolveConsoleMode(false, false), false);
  assert.equal(resolveConsoleMode(true, false), true);
  assert.equal(resolveConsoleMode(false, true), true);
  assert.equal(resolveConsoleMode(true, true), true);
});
