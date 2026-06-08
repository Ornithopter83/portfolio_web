@echo off
setlocal
cd /d "%~dp0.."
powershell -ExecutionPolicy Bypass -File "%~dp0push-main.ps1" %*
pause
