@echo off
title LA BAN TUYEN SINH - WEB APPLICATION
cd /d "%~dp0\frontend"
echo ========================================================
echo   LA BAN TUYEN SINH - KHOI DONG HE THONG (PORT 5173)
echo ========================================================
echo Dang khoi dong Web Dev Server...
call npm run dev
pause
