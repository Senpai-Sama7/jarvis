#!/bin/bash
# Quick audio test
echo "🎤 Testing microphone for 3 seconds..."
arecord -f cd -d 3 -t wav /tmp/test-audio.wav 2>/dev/null
SIZE=$(stat -c%s /tmp/test-audio.wav 2>/dev/null || echo "0")
echo "✓ Recorded $SIZE bytes"
if [ "$SIZE" -gt 10000 ]; then
    echo "✅ Microphone working!"
    echo "Playing back..."
    aplay /tmp/test-audio.wav 2>/dev/null
else
    echo "❌ Microphone not recording properly"
    echo "Check: arecord -l"
fi
rm -f /tmp/test-audio.wav
