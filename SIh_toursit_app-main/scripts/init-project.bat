@echo off

REM SafeSpot Project Initialization Script (Windows)

echo 🚀 Initializing SafeSpot Project...

REM Check if PNPM is installed
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  PNPM is not installed. Installing...
    npm install -g pnpm
)

echo 📦 Installing dependencies with PNPM...
pnpm install

echo 📋 Creating environment files...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo ✅ Created backend/.env - Please update with your Google AI API key
)

if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env"
    echo ✅ Created frontend/.env - Please update with your configuration
)

echo 🎉 Initialization complete!
echo.
echo 📝 Next steps:
echo 1. Update backend/.env with your Google AI API key
echo 2. Run 'pnpm dev' to start the development servers
echo 3. Visit http://localhost:3000 for the frontend
echo 4. Backend AI services will run on port 3001