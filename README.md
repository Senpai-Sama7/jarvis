# 🎙️ JARVIS - AI Voice Assistant

A fully automated voice assistant powered by Groq's Whisper and LLaMA models, providing hands-free AI interaction through natural speech.

## ⚠️ IMPORTANT: Security Notice

This repository has undergone a comprehensive security audit. **Critical vulnerabilities have been identified and documented.** Please review the audit documentation before deployment.

📚 **Start Here**: [AUDIT_README.md](AUDIT_README.md)

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis

# 2. Install dependencies
npm install
sudo apt install sox festival festvox-us-slt-hts alsa-utils

# 3. Configure API key
cp .env.example .env
# Edit .env and add your Groq API key from https://console.groq.com/keys

# 4. Run JARVIS
./jarvis
```

## 📋 Features

- ✅ **Hands-free operation** - Automatic silence detection
- 🎤 **Voice recognition** - Groq Whisper (ultra-fast transcription)
- 🤖 **AI responses** - LLaMA 3.3 70B model
- 🔊 **Text-to-speech** - Natural voice output
- 💬 **Conversation history** - Save/load chat sessions
- 🔧 **Multiple modes** - Standard, enhanced, seamless

## 📚 Documentation

### User Documentation
- [README-VOICE.md](README-VOICE.md) - Voice assistant guide
- [QUICK-START.md](QUICK-START.md) - Quick start guide
- [VOICE-COPILOT.md](VOICE-COPILOT.md) - GitHub Copilot integration

### Audit Documentation (IMPORTANT)
- [AUDIT_README.md](AUDIT_README.md) - **Start here for audit overview**
- [AUDIT_EXECUTIVE_SUMMARY.md](AUDIT_EXECUTIVE_SUMMARY.md) - Critical findings
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Security fixes

## 🚨 Security Status

**Current Status**: 🔴 **CRITICAL ISSUES IDENTIFIED**

This codebase has been audited and contains:
- 4 Critical security vulnerabilities
- 6 High-priority issues
- 80% code duplication
- 0% test coverage

**Action Required**: Review [AUDIT_EXECUTIVE_SUMMARY.md](AUDIT_EXECUTIVE_SUMMARY.md) immediately.

### Quick Security Fixes (80 minutes)

1. **Rotate API Key** (15 min) - Get new key from Groq console
2. **Add Input Sanitization** (30 min) - See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
3. **Add Cleanup Handlers** (15 min) - Prevent resource leaks
4. **Start Memory Monitoring** (20 min) - Detect issues early

## 🛠️ Installation

### System Requirements
- Node.js >= 16.0.0
- Linux (Ubuntu/Debian recommended)
- Microphone
- Internet connection

### Dependencies
```bash
# System packages
sudo apt install sox festival festvox-us-slt-hts alsa-utils curl

# Node packages
npm install
```

## 🎯 Usage

### Standard Mode
```bash
./jarvis
```

### Enhanced Mode (More Features)
```bash
node enhanced-jarvis.js
```

### Voice Commands
- "end conversation jarvis" - Exit
- "clear history" - Reset conversation
- "save conversation" - Save to file
- "show stats" - Display session info
- "help" - Show available commands

## 🏗️ Architecture

```
jarvis/
├── src/                    # Source code (to be created)
├── jarvis.js              # Main entry point
├── voice-core.js          # Shared voice functionality
├── package.json           # Dependencies
├── .env.example           # Configuration template
└── docs/                  # Documentation
    ├── AUDIT_*.md         # Security audit
    └── README-*.md        # User guides
```

## 🧪 Testing

**Current Status**: No tests implemented

See [COMPREHENSIVE_CODE_AUDIT_PART3.md](COMPREHENSIVE_CODE_AUDIT_PART3.md) for testing strategy.

## 🤝 Contributing

This project requires significant refactoring before accepting contributions. Please review:
1. [AUDIT_EXECUTIVE_SUMMARY.md](AUDIT_EXECUTIVE_SUMMARY.md) - Current state
2. [COMPREHENSIVE_CODE_AUDIT_PART4.md](COMPREHENSIVE_CODE_AUDIT_PART4.md) - Remediation roadmap

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- [Groq Console](https://console.groq.com/) - Get API key
- [Groq Documentation](https://console.groq.com/docs) - API docs
- [Audit Documentation](AUDIT_README.md) - Security audit

## ⚠️ Disclaimer

**This software is provided as-is with known security vulnerabilities.** Do not use in production without implementing the security fixes documented in the audit reports.

**Known Issues**:
- Exposed API credentials (if not properly configured)
- Command injection vulnerabilities
- Memory leaks
- No input validation

**Recommended Action**: Complete Phase 1 security fixes before deployment.

## 📞 Support

For issues related to:
- **Security**: Review audit documentation first
- **Setup**: Check QUICK-START.md
- **Usage**: See README-VOICE.md
- **Development**: Read IMPLEMENTATION_GUIDE.md

## 🎓 Credits

Built with:
- [Groq](https://groq.com/) - AI inference
- [Whisper](https://openai.com/research/whisper) - Speech recognition
- [LLaMA](https://ai.meta.com/llama/) - Language model
- [Festival](http://www.cstr.ed.ac.uk/projects/festival/) - Text-to-speech

---

**Status**: 🔴 Requires security remediation before production use  
**Last Audit**: 2024  
**Next Steps**: Review [AUDIT_README.md](AUDIT_README.md)
