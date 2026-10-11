@echo off
title HERMES // COLLEGE ECOSYSTEM
echo ========================================================
echo  HERMES // COLLEGE ECOSYSTEM PROTOCOL (v2.6)
echo ========================================================
echo.
cd backend
if not exist node_modules (
    echo [INFO] Installing backend dependencies...
    call npm install
)
echo [INFO] Starting server on http://localhost:3000...
node server.js
pause
