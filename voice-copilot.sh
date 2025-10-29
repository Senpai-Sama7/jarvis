#!/bin/bash

# Voice Copilot CLI - Simple bash version
# Usage: ./voice-copilot.sh [duration_in_seconds]

DURATION=${1:-10}
AUDIO_FILE="/tmp/voice-input.wav"
export GROQ_API_KEY="gsk_REDACTED_FOR_SECURITY"

echo "🎙️  Voice Copilot CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Record audio
echo "🎤 Recording for $DURATION seconds... (Press Ctrl+C to stop early)"
arecord -f cd -t wav -d $DURATION $AUDIO_FILE 2>/dev/null
echo "✓ Recording complete"

# Step 2: Transcribe with Groq (using curl)
echo "🔄 Transcribing..."
TRANSCRIPTION=$(curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -F "file=@$AUDIO_FILE" \
  -F "model=whisper-large-v3" \
  -F "response_format=text")

echo ""
echo "📝 You said: \"$TRANSCRIPTION\""
echo ""

# Step 3: Get Copilot response
echo "💭 Asking GitHub Copilot..."
RESPONSE=$(gh copilot suggest "$TRANSCRIPTION" 2>&1)

# Step 4: Speak response (if espeak-ng available)
if command -v espeak-ng &> /dev/null; then
    echo "🔊 Speaking response..."
    echo "$RESPONSE" | espeak-ng 2>/dev/null
else
    echo "📢 Response (install espeak-ng for voice output):"
    echo "$RESPONSE"
fi

# Cleanup
rm -f $AUDIO_FILE

echo ""
echo "✅ Done!"
