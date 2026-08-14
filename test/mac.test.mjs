import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { macAppDir, macInfoPlist, macLaunchScript, SHORTCUT_NAME } from '../src/shortcut.mjs';

test('macAppDir resolves under ~/Applications', () => {
  const fakeHome = process.platform === 'win32' ? 'C:\\Users\\tester' : '/Users/tester';
  assert.equal(
    macAppDir(fakeHome),
    path.join(fakeHome, 'Applications', `${SHORTCUT_NAME}.app`),
  );
});

test('macInfoPlist declares the whale icon, bundle id and LSUIElement', () => {
  const plist = macInfoPlist('1.1.0');
  assert.ok(plist.includes(`<string>${SHORTCUT_NAME}</string>`));
  assert.ok(plist.includes('<string>whale-black.icns</string>'));
  assert.ok(plist.includes('<string>1.1.0</string>'));
  assert.ok(plist.includes('com.deepseek.harness.launcher'));
  assert.ok(plist.includes('<key>LSUIElement</key>'));
  assert.ok(plist.includes('<true/>'));
  assert.ok(plist.includes('<string>APPL</string>'));
});

test('macLaunchScript execs the exact node binary with a quoted launcher path', () => {
  const script = macLaunchScript('/opt/homebrew/bin/node', '/Users/me/My Apps/bin/launcher.mjs');
  assert.ok(script.startsWith('#!/bin/sh'));
  assert.ok(script.includes(`exec '/opt/homebrew/bin/node' '/Users/me/My Apps/bin/launcher.mjs' start`));
});

test('macLaunchScript quotes single quotes inside paths', () => {
  const script = macLaunchScript('/usr/bin/node', "/Users/me/O'Brien/bin/launcher.mjs");
  assert.ok(script.includes(`'/Users/me/O'\\''Brien/bin/launcher.mjs'`));
});
