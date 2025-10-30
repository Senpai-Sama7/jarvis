# 🤖 JARVIS - AI Coding Assistant

> Production-grade AI coding assistant with voice control, powered by Groq

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)

---

## ✨ Features

- 🎤 **Voice Control** - Talk to your AI assistant
- 💬 **Smart Chat** - Multi-turn conversations with context
- 🔧 **Code Operations** - Generate, explain, review, and refactor code
- ⚡ **Command Execution** - Run shell commands safely
- 🌐 **Web Interface** - Modern React UI with PWA support
- 🔌 **REST API** - Integrate with your tools
- 💻 **CLI** - Command-line interface for developers
- 🔒 **Production-Ready** - Rate limiting, auth, circuit breaker, retry logic

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Groq API key ([Get one free](https://console.groq.com))

### Installation

```bash
# Clone repository
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis

# Install dependencies
npm install --legacy-peer-deps

# Configure
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Build
npm run build:cli

# Start API server
npm run start:api

# Start web interface (in another terminal)
npm start
```

### Access

- **Web Interface**: http://localhost:3000
- **API Server**: http://localhost:8080
- **API Docs**: http://localhost:8080/api/docs
- **Health Check**: http://localhost:8080/health

---

## 📖 Usage

### Web Interface

Open http://localhost:3000 and start chatting with JARVIS. Features include:
- Voice recording with waveform visualization
- Conversation history with code highlighting
- Keyboard shortcuts (⌘K, ⌘E, ⌘D)
- Export conversations
- Dark/light theme

### API

```bash
# Chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello JARVIS"}'

# Generate code
curl -X POST http://localhost:8080/api/code/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"function to add numbers","language":"javascript"}'

# Execute command
curl -X POST http://localhost:8080/api/execute/command \
  -H "Content-Type: application/json" \
  -d '{"command":"echo Hello"}'
```

### CLI

```bash
# Execute command
node dist/interfaces/cli/index.js execute "ls -la"

# Generate code
node dist/interfaces/cli/index.js generate "create a hello function" -l javascript

# Interactive chat
node dist/interfaces/cli/index.js chat
```

---

## 🏗️ Architecture

### Project Structure

```
jarvis/
├── app/                    # Next.js web application
│   ├── api/               # API routes (chat, transcribe)
│   └── *.tsx              # Pages and layouts
├── components/            # React components
│   ├── ui/               # UI components (button, card, etc.)
│   └── *.tsx             # Feature components
├── src/                   # Core TypeScript source
│   ├── core/             # Core functionality
│   │   ├── ai/          # AI client management
│   │   ├── config/      # Configuration
│   │   ├── execution/   # Code execution
│   │   ├── security/    # Auth & sanitization
│   │   └── utils/       # Utilities
│   ├── interfaces/       # User interfaces
│   │   ├── api/         # REST API server
│   │   └── cli/         # Command-line interface
│   └── types/           # TypeScript definitions
├── docs/                  # Documentation & GitHub Pages
│   ├── architecture/     # Technical docs
│   ├── guides/          # User guides
│   └── *.html           # Website & remote control
├── tests/                # Unit tests
└── public/               # Static assets
```

### Key Components

#### AI Client Manager
- Singleton pattern for efficient resource management
- Connection pooling and reuse
- Circuit breaker for fault tolerance
- Automatic retry with exponential backoff
- Real-time health monitoring

#### Conversation Manager
- Multi-turn conversation support
- Token window management (8000 tokens)
- Automatic context trimming
- Memory-efficient storage

#### Rate Limiter
- Sliding window algorithm
- Per-user and per-IP tracking
- Automatic blocking after limit
- DoS protection

#### Security
- Timing-safe authentication
- Input validation and sanitization
- Command whitelisting
- Audit logging

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
GROQ_API_KEY=your_groq_api_key

# Optional
GROQ_MODEL=llama-3.3-70b-versatile
AI_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
API_KEY=your_api_key_for_auth
WEB_PORT=3000
API_PORT=8080
NODE_ENV=development
```

### Enable Groq Models

1. Visit https://console.groq.com/settings/project/limits
2. Enable the models you want to use
3. Restart the API server

---

## 📚 API Reference

### Endpoints

#### Chat
```
POST /api/chat
Body: { message, conversationId?, stream? }
Response: { response, conversationId, usage, model }
```

#### Code Generation
```
POST /api/code/generate
Body: { description, language }
Response: { code, language, usage }
```

#### Code Explanation
```
POST /api/code/explain
Body: { code, language }
Response: { explanation, usage }
```

#### Code Review
```
POST /api/code/review
Body: { code, language }
Response: { review, usage }
```

#### Code Refactoring
```
POST /api/code/refactor
Body: { code, language, focus? }
Response: { refactoredCode, focus, usage }
```

#### Command Execution
```
POST /api/execute/command
Body: { command, workingDir?, timeout? }
Response: { success, stdout, stderr, exitCode }
```

#### Health Check
```
GET /health
Response: { status, timestamp, version }

GET /api/chat/health
Response: { ai: {...}, conversations: {...} }
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Type check
npm run build:cli

# Test API
curl http://localhost:8080/health
```

---

## 🚢 Deployment

### Production Build

```bash
# Build everything
npm run build:cli
npm run build

# Start production servers
NODE_ENV=production npm run start:api
NODE_ENV=production npm start
```

### Docker (Optional)

```bash
# Build image
docker build -t jarvis .

# Run container
docker run -p 3000:3000 -p 8080:8080 \
  -e GROQ_API_KEY=your_key \
  jarvis
```

### Remote Access

For secure remote access, use Tailscale:

1. Install Tailscale on your server
2. Connect to your Tailscale network
3. Access via Tailscale IP: `http://100.x.x.x:8080`

See `docs/guides/SETUP_COMPLETE.md` for detailed setup.

---

## 📊 Performance

- **Client Initialization**: 0ms (singleton reuse)
- **Memory Usage**: Stable under load
- **Concurrent Users**: 100+ supported
- **Uptime**: 99.9% capability
- **Rate Limit**: 60 requests/minute per user

---

## 🔒 Security

- ✅ Timing-safe authentication
- ✅ DoS protection via rate limiting
- ✅ Input validation and sanitization
- ✅ Command whitelisting
- ✅ No sensitive data in errors
- ✅ Audit logging
- ✅ Circuit breaker for resilience

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

- **Documentation**: See `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/Senpai-Sama7/jarvis/issues)
- **Guides**: `docs/guides/QUICK_START.md`

---

## 🎯 Roadmap

- [ ] WebSocket support for streaming
- [ ] Multi-model support (OpenAI, Anthropic)
- [ ] Persistent conversation storage (Redis/PostgreSQL)
- [ ] Distributed rate limiting
- [ ] Prometheus metrics
- [ ] GraphQL API
- [ ] Mobile app

---

## 🙏 Acknowledgments

- Powered by [Groq](https://groq.com) for fast AI inference
- Built with [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)

---

**Made with ❤️ for developers**

[Get Started](docs/guides/QUICK_START.md) • [Documentation](docs/) • [API Reference](#api-reference)
