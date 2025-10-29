#!/bin/bash

# True Hands-Free Voice Mode for GitHub Copilot
# Automatically types transcriptions into the active terminal
#
# This creates a seamless voice experience:
# 1. You speak
# 2. Voice is transcribed
# 3. Text is automatically typed into THIS terminal
# 4. You see my response
# 5. Repeat

GROQ_API_KEY="gsk_REDACTED_FOR_SECURITY"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get the terminal device where gh copilot is running
COPILOT_TTY="${1:-$(tty)}"

echo "🎙️  Hands-Free Voice Mode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Configuration:"
echo "  Target terminal: $COPILOT_TTY"
echo "  Groq API: Configured"
echo "  Auto-type: Enabled"
echo ""
echo "How it works:"
echo "  1. Speak into your microphone"
echo "  2. Press Ctrl+C to stop recording"
echo "  3. Text is automatically typed into your Copilot session"
echo "  4. Wait for response, then repeat"
echo ""
echo "Commands:"
echo "  - Ctrl+C once: Stop recording and send"
echo "  - Ctrl+C twice: Exit voice mode"
echo ""

# Check dependencies
for cmd in arecord curl xdotool; do
    if ! command -v $cmd &> /dev/null; then
        echo "❌ Missing: $cmd"
        if [ "$cmd" = "xdotool" ]; then
            echo "   Install: sudo apt install xdotool"
        elif [ "$cmd" = "arecord" ]; then
            echo "   Install: sudo apt install alsa-utils"
        else
            echo "   Install: sudo apt install $cmd"
        fi
        exit 1
    fi
done

echo "✓ All dependencies found"
echo ""
echo "Starting in 3 seconds..."
echo "Make sure your Copilot terminal window is active!"
sleep 3
echo ""

cleanup() {
    echo ""
    echo ""
    echo "👋 Voice mode deactivated"
    rm -f /tmp/voice-input-*.wav /tmp/copilot-voice-*.txt
    exit 0
}

trap cleanup SIGINT SIGTERM

CONVERSATION_NUM=0

while true; do
    CONVERSATION_NUM=$((CONVERSATION_NUM + 1))
    AUDIO_FILE="/tmp/voice-input-${CONVERSATION_NUM}.wav"
    
    echo "═══════════════════════════════════════════════════"
    echo "🎤 Recording #${CONVERSATION_NUM}... (Ctrl+C when done)"
    echo "═══════════════════════════════════════════════════"
    echo ""
    
    # Record audio (using arecord for better compatibility)
    arecord -f cd -t wav "$AUDIO_FILE" 2>/dev/null
    
    if [ ! -f "$AUDIO_FILE" ]; then
        echo "⚠️  No recording, skipping..."
        continue
    fi
    
    SIZE=$(stat -c%s "$AUDIO_FILE" 2>/dev/null || stat -f%z "$AUDIO_FILE" 2>/dev/null || echo "0")
    if [ "$SIZE" -lt 1000 ]; then
        echo "⚠️  Recording too short, skipping..."
        rm -f "$AUDIO_FILE"
        continue
    fi
    
    echo ""
    echo "✓ Recording complete (${SIZE} bytes)"
    echo "🔄 Transcribing..."
    
    # Transcribe
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
    echo "📝 YOU SAID: \"$TRANSCRIPTION\""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⌨️  Auto-typing into Copilot terminal..."
    
    # Give user a moment to switch windows if needed
    sleep 1
    
    # Find the window ID of the Copilot terminal
    # Try to focus it automatically
    WINDOW_ID=$(xdotool search --name "copilot\|github\|bash\|terminal" | head -1)
    
    if [ -n "$WINDOW_ID" ]; then
        xdotool windowactivate "$WINDOW_ID" 2>/dev/null
        sleep 0.3
    fi
    
    # Type the transcription
    xdotool type --delay 50 "$TRANSCRIPTION"
    sleep 0.2
    xdotool key Return
    
    echo "✓ Sent to Copilot!"
    echo ""
    
    # Cleanup
    rm -f "$AUDIO_FILE"
    
    # Wait before next recording
    echo "⏸️  Waiting 8 seconds for response..."
    echo "   (You can start speaking again after the response)"
    sleep 8
    echo ""
done
