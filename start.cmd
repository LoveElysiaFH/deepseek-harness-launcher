@echo off
rem DeepSeek Harness Launcher — visible-console start (for debugging).
rem For the silent double-click experience use the desktop shortcut
rem created by:  node "%~dp0bin\launcher.mjs" install
node "%~dp0bin\launcher.mjs" start %*
if errorlevel 1 pause
