@echo off
rem DeepSeek Harness Launcher — visible console mode (shows live dsh logs).
rem Closing this window stops DeepSeek Harness.
node "%~dp0bin\launcher.mjs" start --console %*
if errorlevel 1 pause
