#!/bin/bash

# Final verification script to ensure both frontend and backend build successfully

echo "🔍 Final Verification of SafeSpot Application Build Process"
echo "========================================================="

# Track overall success
SUCCESS=true

# Test 1: Backend TypeScript Compilation
echo ""
echo "🧪 Test 1: Backend TypeScript Compilation"
echo "----------------------------------------"
cd backend
if npx tsc; then
    echo "✅ Backend TypeScript compilation successful"
else
    echo "❌ Backend TypeScript compilation failed"
    SUCCESS=false
fi
cd ..

# Test 2: Frontend Build Process
echo ""
echo "🧪 Test 2: Frontend Build Process"
echo "---------------------------------"
cd frontend
if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    SUCCESS=false
fi
cd ..

# Test 3: Check for Dist Directory (Backend Build Output)
echo ""
echo "🧪 Test 3: Backend Build Output"
echo "-------------------------------"
if [ -d "backend/dist" ] && [ "$(ls -A backend/dist)" ]; then
    echo "✅ Backend build output directory exists and is not empty"
else
    echo "⚠️  Backend build output directory is missing or empty (may be OK if no output-producing build steps)"
fi

# Test 4: Check for Next.js Build Output (Frontend Build)
echo ""
echo "🧪 Test 4: Frontend Build Output"
echo "-------------------------------"
if [ -d "frontend/.next" ] && [ -f "frontend/.next/BUILD_ID" ]; then
    echo "✅ Frontend Next.js build output exists"
else
    echo "❌ Frontend Next.js build output is missing"
    SUCCESS=false
fi

# Final Result
echo ""
echo "🏁 Final Verification Result"
echo "==========================="
if $SUCCESS; then
    echo "🎉 All tests passed! The application builds successfully."
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Set up your Google AI API key in backend/.env"
    echo "   2. Run the backend: cd backend && npm run dev"
    echo "   3. Run the frontend: cd frontend && npm run dev"
    echo "   4. Visit http://localhost:9002 in your browser"
else
    echo "❌ Some tests failed. Please check the output above for details."
    exit 1
fi