# JARVIS 2.0 - Multi-Interface AI Coding Assistant

<div align="center">

![JARVIS Logo](https://github.com/user-attachments/assets/914d079a-1069-4ac9-9259-393e8864e234)

**Your personal AI coding assistant with CLI, TUI, GUI, Web, and API interfaces**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Senpai-Sama7/jarvis)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

</div>

## ✨ Features

- 🎯 **Multi-Interface Support** - CLI, TUI, GUI, Web, and HTTP API
- 🤖 **Advanced AI** - Powered by Groq's LLaMA 3.3 70B
- 🎤 **Voice Control** - Speech-to-text and text-to-speech across all interfaces
- 🔒 **Security First** - Input sanitization, API key management, rate limiting
- 🔌 **Plugin System** - Extensible architecture for custom features
- 📝 **Code Tools** - Generate, explain, refactor, and review code
- 🌍 **Multi-Language** - Support for all major programming languages
- 📊 **Type Safe** - Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A Groq API key (free at [console.groq.com](https://console.groq.com/keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis

# Run setup script
./scripts/setup-dev.sh

# Add your API key to .env
echo "GROQ_API_KEY=your_key_here" > .env
```

### Usage

#### CLI Interface

```bash
# Interactive mode
npm run start:cli

# Direct commands
node dist/interfaces/cli/index.js generate "REST API endpoint"
node dist/interfaces/cli/index.js explain myfile.ts
node dist/interfaces/cli/index.js review mycode.js
```

#### HTTP API

```bash
# Start API server
npm run start:api

# API will be available at http://localhost:8080
# Documentation at http://localhost:8080/api/docs
```

#### Web Interface

```bash
# Start web interface
npm run dev

# Open http://localhost:3000
```

## 📖 Documentation

### User Guides

- [CLI Guide](docs/user/cli-guide.md) - Command-line interface
- [API Guide](docs/user/api-guide.md) - HTTP API reference
- [Web Guide](README-WEB.md) - Web application guide

### Developer Documentation

- [Architecture](ARCHITECTURE.md) - System architecture overview
- [Contributing](docs/developer/contributing.md) - How to contribute
- [Security](AUDIT_README.md) - Security documentation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interfaces                         │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│   CLI    │   TUI    │   GUI    │   Web    │      API        │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │    Unified Core    │
                    │  (Shared Logic)    │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │   AI    │          │  Voice  │          │  Code   │
   │ Engine  │          │ Engine  │          │  Tools  │
   └─────────┘          └─────────┘          └─────────┘
```

### Key Components

- **Core** - Shared business logic for all interfaces
  - AI/LLM integration (Groq, Anthropic, OpenAI)
  - Voice processing (recording, transcription, synthesis)
  - Code tools (analysis, execution, refactoring)
  - Security (authentication, sanitization)
  - Configuration management

- **Interfaces** - User-facing layers
  - CLI - Command-line interface
  - TUI - Terminal UI (blessed)
  - GUI - Desktop app (Electron)
  - Web - Web application (Next.js)
  - API - HTTP REST API (Express)

- **Plugins** - Extensible plugin system
  - Custom language support
  - Additional AI providers
  - Custom code tools

## 🎯 Use Cases

### Code Generation

```bash
# CLI
jarvis generate "function to sort array of objects by date"

# API
curl -X POST http://localhost:8080/api/code/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "function to sort array", "language": "typescript"}'
```

### Code Review

```bash
# CLI
jarvis review src/api/routes.ts

# API
curl -X POST http://localhost:8080/api/code/review \
  -H "Content-Type: application/json" \
  -d '{"code": "function hello() {...}", "language": "javascript"}'
```

### Interactive Chat

```bash
# CLI
jarvis chat

# Then ask questions:
💬 You: How do I implement JWT authentication?
🤖 JARVIS: [provides detailed explanation]
```

## 🔒 Security

This version addresses all security issues from the audit:

✅ No hardcoded API keys  
✅ Input sanitization on all inputs  
✅ Command injection prevention  
✅ Rate limiting on API endpoints  
✅ Optional authentication  
✅ Secure secrets management  

See [AUDIT_README.md](AUDIT_README.md) for security documentation.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

## 🔌 Plugin System

Create custom plugins to extend JARVIS:

```typescript
// plugins/my-plugin.ts
import { Plugin, PluginContext } from '../src/types';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  
  async init(context: PluginContext) {
    // Register custom commands, routes, etc.
    context.registerCommand({
      name: 'mycommand',
      description: 'My custom command',
      handler: async (args) => {
        // Command implementation
      },
    });
  },
  
  async destroy() {
    // Cleanup
  },
};
```

## 📊 Comparison with Other Tools

| Feature | JARVIS | GitHub Copilot | Cursor | codex-cli |
|---------|--------|----------------|--------|-----------|
| CLI | ✅ | ❌ | ❌ | ✅ |
| TUI | ✅ | ❌ | ❌ | ❌ |
| GUI | ✅ | ✅ | ✅ | ❌ |
| Web | ✅ | ✅ | ❌ | ❌ |
| API | ✅ | ✅ | ❌ | ❌ |
| Voice | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ❌ | ❌ | ✅ |
| Open source | ✅ | ❌ | ❌ | ✅ |
| Plugin system | ✅ | ✅ | ✅ | ❌ |

## 🛣️ Roadmap

- [x] Core architecture refactoring
- [x] CLI interface
- [x] HTTP API
- [x] Security improvements
- [ ] TUI interface (blessed)
- [ ] GUI interface (Electron)
- [ ] Voice integration
- [ ] Plugin marketplace
- [ ] VS Code extension
- [ ] Cloud deployment option

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/developer/contributing.md) for guidelines.

### Development

```bash
# Setup development environment
./scripts/setup-dev.sh

# Build core
npm run build:core

# Run tests
npm test

# Lint code
npm run lint
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with:
- [Groq](https://groq.com/) - Ultra-fast AI inference
- [Anthropic Claude](https://anthropic.com/) - Advanced language model
- [Whisper](https://openai.com/research/whisper) - Speech recognition
- [Next.js](https://nextjs.org/) - React framework
- [Express](https://expressjs.com/) - Web framework
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/Senpai-Sama7/jarvis/issues)
- 💬 [Discussions](https://github.com/Senpai-Sama7/jarvis/discussions)

## ⚖️ Disclaimer

JARVIS is provided as-is without warranty. Always review generated code before use in production.

---

<div align="center">

Made with ❤️ by the JARVIS community

[Website](https://jarvis.dev) • [Documentation](docs/) • [Community](https://github.com/Senpai-Sama7/jarvis/discussions)

</div>
