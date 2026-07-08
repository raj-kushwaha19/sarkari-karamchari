@echo off
echo ====================================================
echo  Sarkari Karamchari - AI Platform Starting...
echo ====================================================

echo Starting Backend Server...
cd backend
start cmd /k "npm run dev"

cd ..
echo Starting Frontend Server...
cd frontend
start cmd /k "npm run dev"

echo.
echo ====================================================
echo  Servers are starting in separate windows.
echo  Please wait 10 seconds, then open your browser
echo  and go to: http://localhost:3000
echo ====================================================
echo.
pause
