@echo off

REM Final verification script to ensure both frontend and backend build successfully

echo 🔍 Final Verification of SafeSpot Application Build Process
echo =========================================================

REM Track overall success
set SUCCESS=true

REM Test 1: Backend TypeScript Compilation
echo.
echo 🧪 Test 1: Backend TypeScript Compilation
echo ----------------------------------------
cd backend
npx tsc
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend TypeScript compilation successful
) else (
    echo ❌ Backend TypeScript compilation failed
    set SUCCESS=false
)
cd ..

REM Test 2: Frontend Build Process
echo.
echo 🧪 Test 2: Frontend Build Process
echo ---------------------------------
cd frontend
npm run build
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend build successful
) else (
    echo ❌ Frontend build failed
    set SUCCESS=false
)
cd ..

REM Test 3: Check for Dist Directory (Backend Build Output)
echo.
echo 🧪 Test 3: Backend Build Output
echo -------------------------------
if exist "backend\dist" (
    if not exist "backend\dist\*" (
        echo ⚠️  Backend build output directory is empty
    ) else (
        echo ✅ Backend build output directory exists and contains files
    )
) else (
    echo ⚠️  Backend build output directory does not exist (may be OK if no output-producing build steps)
)

REM Test 4: Check for Next.js Build Output (Frontend Build)
echo.
echo 🧪 Test 4: Frontend Build Output
echo -------------------------------
if exist "frontend\.next\BUILD_ID" (
    echo ✅ Frontend Next.js build output exists
) else (
    echo ❌ Frontend Next.js build output is missing
    set SUCCESS=false
)

REM Final Result
echo.
echo 🏁 Final Verification Result
echo ===========================
if "%SUCCESS%"=="true" (
    echo 🎉 All tests passed! The application builds successfully.
    echo.
    echo 🚀 Next steps:
    echo    1. Set up your Google AI API key in backend/.env
    echo    2. Run the backend: cd backend && npm run dev
    echo    3. Run the frontend: cd frontend && npm run dev
    echo    4. Visit http://localhost:9002 in your browser
) else (
    echo ❌ Some tests failed. Please check the output above for details.
    exit /b 1
)