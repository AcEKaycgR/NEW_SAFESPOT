@echo off

REM Clean up script to remove any node_modules that shouldn't be committed

echo 🧹 Cleaning up node_modules directories...

REM Remove node_modules directories if they exist
if exist "node_modules" (
  echo Removing root node_modules...
  rmdir /s /q node_modules
)

if exist "frontend\\node_modules" (
  echo Removing frontend node_modules...
  rmdir /s /q frontend\\node_modules
)

if exist "backend\\node_modules" (
  echo Removing backend node_modules...
  rmdir /s /q backend\\node_modules
)

REM Remove package-lock.json files if they exist in the wrong places
if exist "frontend\\package-lock.json" (
  echo Removing frontend package-lock.json...
  del frontend\\package-lock.json
)

if exist "backend\\package-lock.json" (
  echo Removing backend package-lock.json...
  del backend\\package-lock.json
)

echo ✅ Cleanup complete!
echo.
echo 💡 Remember to run 'pnpm install' to reinstall dependencies properly.