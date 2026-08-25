@echo off
echo ============================================
echo   GENIE - Starting Application
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (port 5000)...
start "Genie-Server" cmd /c "cd /d "%~dp0server" && node server.js"

echo [2/2] Starting Frontend (port 5173)...
start "Genie-Client" cmd /c "cd /d "%~dp0client" && npm run dev"

echo.
echo ============================================
echo   All services started!
echo ============================================
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Admin    : http://localhost:5173/admin
echo.
echo   Login credentials:
echo   Admin   : admin@gmail.com / admin@1234
echo   User    : user1@example.com / password123
echo   Provider: provider1@example.com / password123
echo.
echo ============================================
pause
