#!/bin/bash
echo "🚀 JARVIS Quick Start"
echo "===================="
echo ""
echo "Choose an interface:"
echo "1) Web Interface (http://localhost:3000)"
echo "2) CLI Interactive Chat"
echo "3) API Server (http://localhost:8080)"
echo "4) Voice Assistant"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo "Starting web interface..."
    npm run dev
    ;;
  2)
    echo "Starting CLI chat..."
    npm run start:cli chat
    ;;
  3)
    echo "Starting API server..."
    npm run start:api
    ;;
  4)
    echo "Starting voice assistant..."
    npm run start:voice
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
