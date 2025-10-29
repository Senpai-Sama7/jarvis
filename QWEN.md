# JARVIS Voice Assistant - Project Context

## Overview
JARVIS is a fully automated voice assistant built with Node.js that provides a hands-free, natural voice interface to an AI coding assistant. The system uses Groq's Whisper API for ultra-fast speech-to-text transcription and LLaMA 3.3 for AI responses, with Festival text-to-speech for audio output.

## Architecture
The system consists of several components:
- `jarvis.js` - Main voice assistant entry point with continuous conversation loop
- `voice-core.js` - Shared functionality for audio recording, transcription, AI responses, and TTS
- Various mode-specific scripts for different interaction patterns
- Shell scripts for setup and utilities

## Key Features
- **Hands-free operation**: Automatic silence detection stops recording after 2 seconds of silence
- **Continuous conversation**: Natural back-and-forth without manual intervention
- **Conversation persistence**: Save/load chat history functionality
- **Multiple operation modes**: Simple, split-screen (tmux), standalone AI, and full auto modes
- **System integration**: Direct microphone access via ALSA, audio processing with SoX
- **API integration**: Groq AI services for transcription and chat completions

## Dependencies
- **System**: sox, festival, festvox-us-slt-hts, alsa-utils, curl, espeak-ng
- **Node.js**: form-data, dotenv, and other standard utilities
- **External**: Groq API key for Whisper transcription and LLaMA 3.3 responses

## Configuration
The system is configured via `.env` file with settings:
- `GROQ_API_KEY` - Required API key from Groq
- `GROQ_MODEL` - AI model to use (default: llama-3.3-70b-versatile)
- `WHISPER_MODEL` - Transcription model (default: whisper-large-v3)
- `SILENCE_DURATION` - Seconds of silence to wait for (default: 2)
- `SILENCE_THRESHOLD` - Volume threshold for silence detection (default: 5%)

## Main Execution Methods
1. `./jarvis` - Standard fully automated voice assistant
2. `./jarvis-enhanced.js` - Enhanced version with additional features
3. `./start-voice-mode.sh` - Interactive mode selector for different operation modes
4. `node jarvis.js` - Direct Node.js execution

## File Structure
- Main scripts: `jarvis`, `jarvis.js`, `jarvis-enhanced.js`
- Core functionality: `voice-core.js`
- Utility scripts: `setup.sh`, `tts.sh`, `test-audio.sh`
- Mode-specific: `voice-mode.sh`, `voice-mode-tmux.js`, `voice-seamless.js`
- Documentation: `README-VOICE.md`, `QUICK-START.md`, `VOICE-COPILOT.md`
- Configuration: `.env`, `.gitignore`, `package.json`

## Voice Commands
- "end conversation jarvis" - Exit the assistant
- "clear history" - Reset conversation
- "save conversation" - Save to file
- "load conversation" - Load from file
- Ctrl+C twice - Emergency exit

## Development Notes
- The project is primarily a Node.js voice assistant with some Next.js dependencies from a template
- The main functionality is in the voice-core.js module which handles all audio/AI operations
- The system automatically detects and fixes audio issues during startup
- All conversation history is maintained in-memory with optional persistence to disk