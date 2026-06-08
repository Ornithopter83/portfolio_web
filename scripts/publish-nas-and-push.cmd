@echo off
setlocal
cd /d "%~dp0.."
powershell -ExecutionPolicy Bypass -File "%~dp0publish-nas-and-push.ps1" %*
pause
