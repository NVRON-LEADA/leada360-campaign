@echo off
echo ============================================================
echo  LeadA360 Campaign - Starting Django Backend Server
echo ============================================================
cd /d %~dp0backend
echo.
echo [1/3] Activating virtual environment...
call venv\Scripts\activate.bat
echo.
echo [2/3] Starting Django on http://127.0.0.1:8000 ...
echo       (Keep this window open while using the app)
echo.
python manage.py runserver 127.0.0.1:8000
pause

