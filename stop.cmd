@echo off
rem DeepSeek Harness Launcher — stop the instance started by the launcher.
node "%~dp0bin\launcher.mjs" stop %*
if errorlevel 1 pause
