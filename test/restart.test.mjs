import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planRestart } from '../src/server.mjs';

test('planRestart returns fresh when nothing is serving', () => {
  assert.equal(planRestart({ serving: false, managed: false, restartOnRerun: true, consoleMode: true }), 'fresh');
  assert.equal(planRestart({ serving: false, managed: true, restartOnRerun: true }), 'fresh');
});

test('planRestart opens (no restart) when restart and console are both off', () => {
  assert.equal(planRestart({ serving: true, managed: true, restartOnRerun: false, consoleMode: false }), 'open');
  assert.equal(planRestart({ serving: true, managed: false, restartOnRerun: false, consoleMode: false }), 'open');
});

test('planRestart restarts when restartOnRerun is on, managed or not', () => {
  assert.equal(planRestart({ serving: true, managed: true, restartOnRerun: true }), 'restart');
  assert.equal(planRestart({ serving: true, managed: false, restartOnRerun: true }), 'restart');
});

test('planRestart restarts in console mode regardless of who started it', () => {
  assert.equal(planRestart({ serving: true, managed: true, restartOnRerun: false, consoleMode: true }), 'restart');
  assert.equal(planRestart({ serving: true, managed: false, restartOnRerun: false, consoleMode: true }), 'restart');
});
