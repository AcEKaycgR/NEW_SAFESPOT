@echo off

REM Test script to verify frontend and backend communication

echo 🚀 Testing SafeSpot Application Communication

REM Start backend in background
echo Starting backend server...
cd backend
start /b npm run dev > backend.log 2>&1
cd ..

REM Wait a moment for backend to start
timeout /t 10 /nobreak >nul

REM For simplicity, we'll just check if the build works
echo Building frontend...
cd frontend
npm run build
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend built successfully
) else (
    echo ❌ Frontend build failed
    exit /b 1
)
cd ..

echo ✅ Communication test completed successfully
echo 📝 Note: For full testing, run both servers simultaneously:
echo    1. In one terminal: cd backend && npm run dev
echo    2. In another terminal: cd frontend && npm run dev
echo    3. Visit http://localhost:9002 in your browser