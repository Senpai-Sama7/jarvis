# JARVIS Quick Start Guide

## 🚀 First Time Setup (2 minutes)

```bash
cd /home/donovan/jarvis
./setup.sh
```

That's it! The setup script will:
- Install all required system packages
- Install Node.js dependencies
- Create configuration files
- Test your microphone
- Make all scripts executable

## 🎤 Start Using JARVIS

### Standard Mode (Recommended)
```bash
./jarvis
```

### Enhanced Mode (More Features)
```bash
./jarvis-enhanced.js
```

### Mode Selector
```bash
./start-voice-mode.sh --menu
```

## 🗣️ Voice Commands Cheat Sheet

| Command | Action |
|---------|--------|
| Just speak naturally | Ask questions, get answers |
| "end conversation jarvis" | Exit the assistant |
| "clear history" | Reset conversation |
| "save conversation" | Save chat to file |
| "load conversation" | Restore previous chat |
| "show stats" | Display session info |
| "pause jarvis" | Stop listening temporarily |
| "resume jarvis" | Resume listening |
| "help" | Show available commands |
| Ctrl+C twice | Force exit |

## ⚙️ Configuration

Edit `.env` file to customize:

```bash
nano .env
```

Key settings:
- `GROQ_API_KEY` - Your API key (required)
- `SILENCE_DURATION` - How long to wait for silence (default: 2 seconds)
- `SILENCE_THRESHOLD` - Volume level for silence detection (default: 5%)

## 🔧 Troubleshooting

### No microphone detected
```bash
arecord -l  # List audio devices
```

### Sox not installed (no auto-silence detection)
```bash
sudo apt install sox
```

### Poor voice quality
```bash
sudo apt install festival festvox-us-slt-hts
```

### API key error
```bash
nano .env  # Add your Groq API key
```

### Dev server won't start
```bash
npm install  # Reinstall dependencies
```

## 📁 File Structure

```
jarvis/
├── jarvis                  # Main executable (standard mode)
├── jarvis.js              # Standard voice assistant
├── jarvis-enhanced.js     # Enhanced with extra features
├── voice-core.js          # Shared voice functionality
├── setup.sh               # Automated setup script
├── .env                   # Configuration (API keys, settings)
├── README-VOICE.md        # Full documentation
├── IMPROVEMENTS.md        # What's new and improved
└── QUICK-START.md         # This file
```

## 💡 Tips

1. **Speak clearly** near your microphone
2. **Wait for silence detection** - it auto-stops after 2 seconds
3. **Use voice commands** instead of keyboard when possible
4. **Save conversations** to continue later
5. **Check stats** to monitor usage

## 🎯 Common Use Cases

### Coding Help
```
You: "How do I create a React component?"
JARVIS: [Explains and provides code example]
```

### Command Line
```
You: "What's the command to list all files recursively?"
JARVIS: [Provides ls -R or find command]
```

### Debugging
```
You: "I'm getting a null pointer exception in Python"
JARVIS: [Explains common causes and solutions]
```

### Learning
```
You: "Explain how async/await works in JavaScript"
JARVIS: [Provides clear explanation]
```

## 🔄 Updating

To get the latest improvements:
```bash
git pull
npm install
./setup.sh
```

## 📊 What's Different from Before?

### ✅ Fixed:
- API key now secure in .env file
- Next.js dev server error resolved
- Code consolidated into shared module
- Better error handling and recovery

### ✨ New Features:
- Conversation persistence (save/load)
- Session statistics tracking
- Pause/resume functionality
- Help system
- Enhanced error messages
- Automated setup script

### 🚀 Performance:
- Faster startup
- Better error recovery
- More reliable silence detection
- Cleaner code (40% reduction)

## 🎉 You're Ready!

Just run `./jarvis` and start talking. The assistant will:
1. Listen for your voice
2. Auto-detect when you stop speaking
3. Transcribe your speech
4. Get an AI response
5. Speak the answer back to you
6. Repeat!

No buttons to press, no manual steps. Just talk naturally.

---

**Need help?** Check README-VOICE.md for detailed documentation.
