@echo off
title WINPRO Launcher
echo ==============================================
echo   WINPRO - Windows Calculation & Quotation
echo ==============================================
echo.
echo Starting local web server on port 3000...
start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"
node server.js
pause
