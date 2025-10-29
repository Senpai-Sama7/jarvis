# Voice Copilot CLI

Seamless voice interface for GitHub Copilot using Groq's Whisper API.

## 🚀 Quick Start

```bash
# Install dependencies (one-time)
sudo apt install sox espeak-ng alsa-utils tmux
npm install form-data

# Activate voice mode
./start-voice-mode.sh
```

That's it! Choose your preferred mode and start talking.

## Modes

### Mode 1: Simple Voice Mode ⭐ (Recommended)
Best for using voice with THIS chat session.

- Record voice with one command
- Auto-transcribes and copies to clipboard
- Paste into GitHub Copilot chat
- Full access to all my capabilities
- Continuous loop

**Start:** Select option 1 in `./start-voice-mode.sh`

### Mode 2: Split Screen Mode 📺
Professional tmux setup with split panes.

- Left: Voice input (continuous recording)
- Right: GitHub Copilot CLI session
- Seamless workflow in one window

**Start:** Select option 2 in `./start-voice-mode.sh`

### Mode 3: Standalone AI Mode 🤖
Fully automated conversations without manual paste.

- Automatic silence detection
- Sends to `gh copilot explain`
- Speaks responses aloud
- No manual intervention needed

**Start:** Select option 3 in `./start-voice-mode.sh`

## How It Works

1. **Record** - Speak into your microphone
2. **Transcribe** - Groq Whisper converts speech to text (240x real-time)
3. **Send** - Text goes to GitHub Copilot (auto-paste or manual)
4. **Respond** - Get AI responses (spoken aloud optional)
5. **Repeat** - Continuous conversation loop

## Features

- ⚡ Ultra-fast transcription (240x real-time speed)
- 💰 Extremely cheap (~$0.0003 per interaction)
- 🎯 98% accuracy for English
- 🔊 Optional text-to-speech output
- 🔄 Continuous conversation mode
- 📋 Auto-copy to clipboard
- 🎬 Multiple interface modes

## Voice Commands

- **Ctrl+C once** - Stop current recording and transcribe
- **Ctrl+C twice** - Exit voice mode completely
- **Wait 5 seconds** - Auto-start next recording (Simple Mode)

## Utilities

### Speak any text aloud
```bash
echo "Hello world" | ./tts.sh
./tts.sh /path/to/text-file.txt
```

### Manual voice input (no loop)
```bash
./voice-assistant.sh  # One-time transcription
```

## Tips

- Speak clearly near your microphone
- Works best in quiet environments  
- Use Mode 1 for full chat capabilities
- Use Mode 3 for hands-free operation
- Install espeak-ng for voice output
