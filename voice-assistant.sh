#!/bin/bash

# Seamless Voice Assistant for GitHub Copilot
# This script captures voice, transcribes it, and outputs text to paste into Copilot

GROQ_API_KEY="gsk_REDACTED_FOR_SECURITY"

echo "🎙️  Voice Assistant for GitHub Copilot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Press CTRL+C to exit"
echo ""

while true; do
    AUDIO_FILE="/tmp/voice-input-$(date +%s).wav"
    
    # Record audio (press Ctrl+C to stop)
    echo "🎤 Recording... (Press Ctrl+C to stop)"
    arecord -f cd -t wav $AUDIO_FILE 2>/dev/null
    echo "✓ Recording complete"
    
    # Check file size
    SIZE=$(stat -f%z "$AUDIO_FILE" 2>/dev/null || stat -c%s "$AUDIO_FILE" 2>/dev/null)
    if [ "$SIZE" -lt 1000 ]; then
        echo "⚠️  Recording too short, skipping..."
        rm -f $AUDIO_FILE
        echo ""
        continue
    fi
    
    # Transcribe with Groq
    echo "🔄 Transcribing..."
    TRANSCRIPTION=$(curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \
      -H "Authorization: Bearer $GROQ_API_KEY" \
      -F "file=@$AUDIO_FILE" \
      -F "model=whisper-large-v3" \
      -F "response_format=text")
    
    echo ""
    echo "📝 You said: \"$TRANSCRIPTION\""
    echo ""
    
    # Save to file
    echo "$TRANSCRIPTION" > /tmp/copilot-voice-input.txt
    echo "💾 Saved to: /tmp/copilot-voice-input.txt"
    echo "📋 Now paste this to GitHub Copilot"
    echo ""
    
    # Copy to clipboard if available
    if command -v xclip &> /dev/null; then
        echo "$TRANSCRIPTION" | xclip -selection clipboard
        echo "✨ Copied to clipboard!"
    elif command -v pbcopy &> /dev/null; then
        echo "$TRANSCRIPTION" | pbcopy
        echo "✨ Copied to clipboard!"
    fi
    
    # Cleanup
    rm -f $AUDIO_FILE
    
    echo ""
    echo "Ready for next recording..."
    echo ""
done
