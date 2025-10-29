#!/bin/bash

# Voice Mode for GitHub Copilot CLI
# Single command to activate full voice integration with Claude/Copilot
# 
# This script:
# 1. Continuously records voice input
# 2. Transcribes with Groq
# 3. Auto-sends to GitHub Copilot CLI in THIS session
# 4. Speaks responses aloud

GROQ_API_KEY="gsk_REDACTED_FOR_SECURITY"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🎙️  Voice Mode Activated"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "I'm listening! Speak your questions to GitHub Copilot."
echo "Your voice will be transcribed and sent automatically."
echo ""
echo "Commands:"
echo "  - Press Ctrl+C during recording to stop and transcribe"
echo "  - Press Ctrl+C twice quickly to exit voice mode"
echo ""
echo "Prerequisites:"
echo "  - Run this in a terminal WHERE gh copilot is active"
echo "  - sox, espeak-ng should be installed"
echo ""
echo "Starting in 3 seconds..."
sleep 3
echo ""

# Check dependencies
if ! command -v arecord &> /dev/null; then
    echo "❌ arecord not found. Install: sudo apt install alsa-utils"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "❌ curl not found. Install: sudo apt install curl"
    exit 1
fi

# Create named pipe for communication
PIPE="/tmp/copilot-voice-pipe-$$"
mkfifo "$PIPE" 2>/dev/null || true

cleanup() {
    echo ""
    echo ""
    echo "👋 Voice mode deactivated"
    rm -f "$PIPE" /tmp/voice-input-*.wav /tmp/copilot-voice-*.txt
    exit 0
}

trap cleanup SIGINT SIGTERM

CONVERSATION_NUM=0

while true; do
    CONVERSATION_NUM=$((CONVERSATION_NUM + 1))
    AUDIO_FILE="/tmp/voice-input-${CONVERSATION_NUM}.wav"
    TRANSCRIPT_FILE="/tmp/copilot-voice-${CONVERSATION_NUM}.txt"
    
    echo "═══════════════════════════════════════════════════"
    echo "🎤 Recording #${CONVERSATION_NUM}... (speak now, Ctrl+C when done)"
    echo "═══════════════════════════════════════════════════"
    echo ""
    
    # Record with arecord (Ctrl+C to stop)
    arecord -f cd -t wav "$AUDIO_FILE" 2>/dev/null
    
    # Check if recording was successful
    if [ ! -f "$AUDIO_FILE" ]; then
        echo "⚠️  No recording found, skipping..."
        continue
    fi
    
    # Check file size
    SIZE=$(stat -c%s "$AUDIO_FILE" 2>/dev/null || stat -f%z "$AUDIO_FILE" 2>/dev/null || echo "0")
    if [ "$SIZE" -lt 1000 ]; then
        echo "⚠️  Recording too short (${SIZE} bytes), skipping..."
        rm -f "$AUDIO_FILE"
        echo ""
        continue
    fi
    
    echo ""
    echo "✓ Recording complete (${SIZE} bytes)"
    echo "🔄 Transcribing with Groq..."
    
    # Transcribe with Groq
    TRANSCRIPTION=$(curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \
      -H "Authorization: Bearer $GROQ_API_KEY" \
      -F "file=@$AUDIO_FILE" \
      -F "model=whisper-large-v3" \
      -F "response_format=text" 2>/dev/null)
    
    if [ -z "$TRANSCRIPTION" ]; then
        echo "❌ Transcription failed"
        rm -f "$AUDIO_FILE"
        continue
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 YOU SAID:"
    echo "   \"$TRANSCRIPTION\""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Save transcription
    echo "$TRANSCRIPTION" > "$TRANSCRIPT_FILE"
    
    # Copy to clipboard if available
    if command -v xclip &> /dev/null; then
        echo "$TRANSCRIPTION" | xclip -selection clipboard 2>/dev/null
        echo "✨ Copied to clipboard!"
    elif command -v pbcopy &> /dev/null; then
        echo "$TRANSCRIPTION" | pbcopy 2>/dev/null
        echo "✨ Copied to clipboard!"
    fi
    
    echo ""
    echo "📋 NOW: Paste this into your GitHub Copilot session"
    echo "    (Use Ctrl+Shift+V or right-click paste)"
    echo ""
    echo "💡 TIP: To hear responses aloud, run in another terminal:"
    echo "    echo 'response text' | $SCRIPT_DIR/tts.sh"
    echo ""
    
    # Cleanup old audio
    rm -f "$AUDIO_FILE"
    
    # Wait a moment before next recording
    echo ""
    echo "⏸️  Waiting 5 seconds before next recording..."
    echo "   (Press Ctrl+C now to exit, or wait to continue)"
    sleep 5
    echo ""
done
