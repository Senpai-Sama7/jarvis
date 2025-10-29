#!/bin/bash

# Advanced Voice Mode Starter with Enhanced Options
# Just run: ./start-voice-mode.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default to Enhanced JARVIS (option 5)
if [ "$1" = "--menu" ]; then
    clear
    echo "🎙️  JARVIS Voice Assistant - Advanced Modes"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Select mode:"
    echo ""
    echo "  1) Simple Mode (copy/paste workflow)"
    echo "  2) Split Screen Mode (tmux)"
    echo "  3) Standalone AI Mode"
    echo "  4) Standard JARVIS - Full Auto Mode"
    echo "  5) Enhanced JARVIS - Advanced Features ⭐ (DEFAULT)"
    echo "  6) Advanced JARVIS - Complete Feature Set"
    echo ""
    
    read -p "Choose [1/2/3/4/5/6] or press Enter for Enhanced JARVIS: " choice
    choice=${choice:-5}
else
    # Auto-run Enhanced JARVIS by default
    choice=5
fi

# Make sure all scripts are executable
chmod +x jarvis.js enhanced-jarvis.js advanced-jarvis.js voice-mode.sh *.sh 2>/dev/null || true

case $choice in
  1)
    echo ""
    echo "Starting Simple Voice Mode..."
    echo ""
    exec "$SCRIPT_DIR/voice-mode.sh"
    ;;
  2)
    echo ""
    echo "Starting Split Screen Mode..."
    sleep 1
    exec node "$SCRIPT_DIR/voice-mode-tmux.js"
    ;;
  3)
    echo ""
    echo "Starting Standalone AI Mode..."
    echo ""
    exec node "$SCRIPT_DIR/voice-seamless.js"
    ;;
  4)
    echo ""
    echo "🚀 Starting Standard JARVIS - Fully Automated Voice Assistant"
    echo ""
    exec node "$SCRIPT_DIR/jarvis.js"
    ;;
  5)
    echo ""
    echo "🚀 Starting Enhanced JARVIS - Advanced Features"
    echo ""
    exec node "$SCRIPT_DIR/enhanced-jarvis.js"
    ;;
  6)
    echo ""
    echo "🚀 Starting Advanced JARVIS - Complete Feature Set"
    echo ""
    exec node "$SCRIPT_DIR/advanced-jarvis.js"
    ;;
  *)
    echo ""
    echo "Invalid choice. Starting Enhanced JARVIS by default..."
    sleep 1
    exec node "$SCRIPT_DIR/enhanced-jarvis.js"
    ;;
esac
