#!/bin/bash

# Clean up script to remove any node_modules that shouldn't be committed

echo "🧹 Cleaning up node_modules directories..."

# Remove node_modules directories if they exist
if [ -d "node_modules" ]; then
  echo "Removing root node_modules..."
  rm -rf node_modules
fi

if [ -d "frontend/node_modules" ]; then
  echo "Removing frontend node_modules..."
  rm -rf frontend/node_modules
fi

if [ -d "backend/node_modules" ]; then
  echo "Removing backend node_modules..."
  rm -rf backend/node_modules
fi

# Remove package-lock.json files if they exist in the wrong places
if [ -f "frontend/package-lock.json" ]; then
  echo "Removing frontend package-lock.json..."
  rm -f frontend/package-lock.json
fi

if [ -f "backend/package-lock.json" ]; then
  echo "Removing backend package-lock.json..."
  rm -f backend/package-lock.json
fi

echo "✅ Cleanup complete!"
echo ""
echo "💡 Remember to run 'pnpm install' to reinstall dependencies properly."