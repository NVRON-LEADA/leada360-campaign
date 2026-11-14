@echo off
echo ============================================================
echo  LeadA360 Campaign - Wiping Entire Database to Zero
echo ============================================================
cd /d %~dp0backend
call venv\Scripts\activate.bat
python wipe_db.py
echo.
pause

