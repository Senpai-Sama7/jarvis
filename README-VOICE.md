# 🎙️ JARVIS - Fully Automated Voice Assistant

**One command. Zero hassle.**

## Quick Start

```bash
./jarvis
```

## First-Time Setup

1. **Install dependencies:**
```bash
sudo apt install sox festival festvox-us-slt-hts alsa-utils curl
npm install
```

2. **Configure API key:**
The `.env` file is already created with your Groq API key. To change it:
```bash
nano .env
```

## How It Works

1. 🎤 **Just speak** - Start talking naturally
2. 🔇 **Auto-detects silence** - Waits 2 seconds after you stop
3. 🔄 **Transcribes instantly** - Groq Whisper (ultra-fast)
4. 🤖 **Gets smart response** - Groq LLaMA 3.3
5. 🔊 **Speaks answer** - Natural voice with Festival
6. 🔁 **Repeats** - Continuous conversation

## Voice Commands

- **Just speak** - No buttons! It auto-detects when you're done
- **Say "end conversation jarvis"** - Exit
- **Say "clear history"** - Reset conversation
- **Say "save conversation"** - Save to file
- **Say "load conversation"** - Load from file
- **Press Ctrl+C twice** - Emergency exit

## Features

- ✅ Fully hands-free (no Ctrl+C!)
- 🔇 Smart 2-second silence detection
- 🗣️ Natural voice (not robotic!)
- 🔧 Auto-fixes audio issues
- 💬 Conversation history with persistence
- ⚡ Lightning fast
- 💰 Cheap (~$0.001/interaction)
- 🔒 Secure (API key in .env file)

## Configuration

Edit `.env` to customize:
```bash
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
SILENCE_DURATION=2
SILENCE_THRESHOLD=5%
```

## Troubleshooting

**No microphone detected:**
```bash
arecord -l  # List audio devices
```

**Sox not found:**
```bash
sudo apt install sox
```

**Poor voice quality:**
```bash
sudo apt install festival festvox-us-slt-hts
```

That's it. Just run `./jarvis` and talk!
