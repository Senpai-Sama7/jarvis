#!/bin/bash
# Development Environment Setup Script

set -e

echo "🚀 Setting up JARVIS Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current version: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build core
echo ""
echo "🔨 Building core modules..."
npm run build:core

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo ""
  echo "🔐 Creating .env file from example..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your API keys"
else
  echo ""
  echo "✅ .env file already exists"
fi

# Create config directory if needed
if [ ! -d config ]; then
  echo ""
  echo "📁 Creating config directory..."
  mkdir -p config
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your GROQ_API_KEY"
echo "  2. Get API key from: https://console.groq.com/keys"
echo "  3. Run: npm run start:cli"
echo ""
echo "Available commands:"
echo "  npm run start:cli  - Start CLI interface"
echo "  npm run start:api  - Start HTTP API server"
echo "  npm run dev        - Start web interface"
echo ""
