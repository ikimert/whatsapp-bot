@echo off
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
npm.cmd start
if errorlevel 1 pause
