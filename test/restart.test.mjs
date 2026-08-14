import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planRestart } from '../src/server.mjs';

test('planRestart returns fresh when nothing is serving', () => {
  assert.equal(planRestart({ serving: false, managed: false, restartOnRerun: true }), 'fresh');
  assert.equal(planRestart({ serving: false, managed: true, restartOnRerun: true }), 'fresh');
});

test('planRestart restarts only a managed instance when the flag is on', () => {
  assert.equal(planRestart({ serving: true, managed: true, restartOnRerun: true }), 'restart');
});

test('planRestart opens (no restart) by default', () => {
  assert.equal(planRestart({ serving: true, managed: true, restartOnRerun: false }), 'open');
});

test('planRestart never restarts an unmanaged instance (safety)', () => {
  assert.equal(planRestart({ serving: true, managed: false, restartOnRerun: true }), 'open');
});
