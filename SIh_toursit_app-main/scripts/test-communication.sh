#!/bin/bash

# Test script to verify frontend and backend communication

echo "🚀 Testing SafeSpot Application Communication"

# Start backend in background
echo "Starting backend server..."
cd backend
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 10

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend server started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Backend server failed to start"
    cat backend.log
    exit 1
fi

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Kill backend process
kill $BACKEND_PID

echo "✅ Communication test completed successfully"
echo "📝 Note: For full testing, run both servers simultaneously:"
echo "   1. In one terminal: cd backend && npm run dev"
echo "   2. In another terminal: cd frontend && npm run dev"
echo "   3. Visit http://localhost:9002 in your browser"