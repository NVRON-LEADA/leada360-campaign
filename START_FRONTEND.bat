@echo off
echo ============================================================
echo  LeadA360 Campaign - Starting React Frontend (Vite)
echo ============================================================
cd /d %~dp0
echo.
echo [1/2] Installing dependencies if needed...
call npm install 2>nul
echo.
echo [2/2] Starting Frontend on http://localhost:5173 ...
echo       (Open this URL in your browser)
echo.
npm run dev
pause

