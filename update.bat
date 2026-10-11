@echo off
title HERMES // UPDATE PROTOCOL
echo ========================================================
echo  HERMES // UPDATING CODE AND REBUILDING FRONTEND
echo ========================================================
echo.
echo [1/3] Pulling latest updates from GitHub...
git pull

echo.
echo [2/3] Installing dependencies and building frontend...
cd frontend
call npm install
call npm run build
xcopy /E /I /Y dist\* ..\backend\public\

echo.
echo [3/3] Update completed successfully!
cd ..
pause
