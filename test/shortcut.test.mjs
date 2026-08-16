import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWindowsShortcutScript } from '../src/shortcut.mjs';

const root = 'C:\\Users\\me\\deepseek-harness-launcher';
const iconPath = 'C:\\Users\\me\\deepseek-harness-launcher\\assets\\deepseek-whale-black.ico';

test('console-mode shortcut targets cmd.exe + start-console.cmd', () => {
  const vbs = buildWindowsShortcutScript({ root, iconPath, consoleMode: true });
  assert.ok(vbs.includes('C:\\Windows\\System32\\cmd.exe'), 'should target cmd.exe');
  assert.ok(vbs.includes('start-console.cmd'), 'should run start-console.cmd');
  assert.ok(vbs.includes('sc.IconLocation = icon & ",0"'), 'keeps the whale icon');
  assert.ok(!vbs.includes('wscript.exe'), 'must not be silent');
});

test('silent shortcut targets wscript.exe + start-silent.vbs', () => {
  const vbs = buildWindowsShortcutScript({ root, iconPath, consoleMode: false });
  assert.ok(vbs.includes('C:\\Windows\\System32\\wscript.exe'), 'should target wscript.exe');
  assert.ok(vbs.includes('start-silent.vbs'), 'should run start-silent.vbs');
  assert.ok(!vbs.includes('start-console.cmd'), 'must not be console');
});
