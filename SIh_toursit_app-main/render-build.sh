#!/usr/bin/env bash
# Exit on error
set -o errexit

# Function to check if previous command succeeded
check_success() {
  if [ $? -ne 0 ]; then
    echo "❌ Error occurred in $1"
    exit 1
  else
    echo "✅ $1 completed successfully"
  fi
}

echo "🚀 Starting Render build process..."

# Build backend
echo "📦 Building backend..."
cd backend
npm install
check_success "Backend dependencies installation"

# Set Node.js memory limit for TypeScript build
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
check_success "Backend build"

cd ..

# Build frontend
echo "🌐 Building frontend..."
cd frontend
npm install
check_success "Frontend dependencies installation"

# Export environment variables needed for build
export NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-"http://localhost:3001"}
export NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL:-"ws://localhost:3002"}

# Create a temporary .env file for build process
echo "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL" >> .env.local
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-"placeholder-key-for-build"}" >> .env.local

# Set memory limit for Next.js build
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
check_success "Frontend build"

# Clean up temporary .env.local file
rm -f .env.local

cd ..

echo "🎉 All builds completed successfully!"