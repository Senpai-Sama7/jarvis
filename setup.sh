#!/bin/bash

# JARVIS Setup Script
# Automated installation and configuration

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║         JARVIS Voice Assistant Setup               ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please don't run as root"
   exit 1
fi

echo "📦 Installing system dependencies..."
echo ""

# Check and install required packages
REQUIRED_PACKAGES="sox festival festvox-us-slt-hts alsa-utils curl"
MISSING_PACKAGES=""

for pkg in $REQUIRED_PACKAGES; do
    if ! dpkg -l | grep -q "^ii  $pkg"; then
        MISSING_PACKAGES="$MISSING_PACKAGES $pkg"
    fi
done

if [ -n "$MISSING_PACKAGES" ]; then
    echo "Installing:$MISSING_PACKAGES"
    sudo apt update
    sudo apt install -y $MISSING_PACKAGES
    echo "✓ System packages installed"
else
    echo "✓ All system packages already installed"
fi

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "🔧 Checking configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "Creating .env file..."
    cat > .env << 'EOF'
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
SILENCE_DURATION=2
SILENCE_THRESHOLD=5%
EOF
    echo "✓ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Groq API key"
    echo "   Get one at: https://console.groq.com/keys"
else
    echo "✓ .env file exists"
fi

echo ""
echo "🔧 Making scripts executable..."
chmod +x jarvis jarvis.js jarvis-enhanced.js voice-copilot.ts
chmod +x *.sh

echo ""
echo "🎤 Testing microphone..."
if arecord -l | grep -q "card"; then
    echo "✓ Microphone detected"
else
    echo "⚠️  No microphone detected"
    echo "   Please connect a microphone and run setup again"
fi

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║              Setup Complete! 🎉                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your Groq API key (if needed)"
echo "  2. Run: ./jarvis"
echo ""
echo "Available commands:"
echo "  ./jarvis              - Standard voice assistant"
echo "  ./jarvis-enhanced.js  - Enhanced with more features"
echo "  ./start-voice-mode.sh - Multiple mode selector"
echo ""
