#!/bin/bash

# SafeSpot Project Initialization Script

echo "🚀 Initializing SafeSpot Project..."

# Check if PNPM is installed
if ! command -v pnpm &> /dev/null
then
    echo "⚠️  PNPM is not installed. Installing..."
    npm install -g pnpm
fi

echo "📦 Installing dependencies with PNPM..."
pnpm install

echo "📋 Creating environment files..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please update with your Google AI API key"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env - Please update with your configuration"
fi

echo "🎉 Initialization complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update backend/.env with your Google AI API key"
echo "2. Run 'pnpm dev' to start the development servers"
echo "3. Visit http://localhost:3000 for the frontend"
echo "4. Backend AI services will run on port 3001"