#!/bin/bash

# TTS Helper - Reads text from file or stdin aloud
# Usage: 
#   echo "hello world" | ./tts.sh
#   ./tts.sh /tmp/response.txt

INPUT="${1:-/dev/stdin}"

if [ "$INPUT" = "/dev/stdin" ]; then
    TEXT=$(cat)
else
    TEXT=$(cat "$INPUT")
fi

# Clean text for TTS
CLEAN_TEXT=$(echo "$TEXT" | \
    sed 's/```[^`]*```/code block/g' | \
    sed 's/`[^`]*`/code/g' | \
    sed $'s/\x1b\[[0-9;]*m//g' | \
    sed 's/[📝💭🔊✓🎤🔄❌✨]//g' | \
    head -c 2000)

if command -v espeak-ng &> /dev/null; then
    echo "$CLEAN_TEXT" | espeak-ng --stdin 2>/dev/null
elif command -v say &> /dev/null; then
    echo "$CLEAN_TEXT" | say
else
    echo "Install espeak-ng or say for TTS"
    echo "$TEXT"
fi
