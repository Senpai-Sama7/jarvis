# JARVIS Multi-Interface Architecture

## Overview
JARVIS is a state-of-the-art AI coding assistant with multiple interfaces sharing a unified core.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interfaces                         │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│   CLI    │   TUI    │   GUI    │   Web    │      API        │
│  (Node)  │ (blessed)│(Electron)│ (Next.js)│   (Express)     │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
           │          │          │          │          │
           └──────────┴──────────┴──────────┴──────────┘
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

## Folder Structure

```
jarvis/
├── src/                          # All source code
│   ├── core/                     # Unified core logic
│   │   ├── ai/                   # AI/LLM integration
│   │   │   ├── groq-client.ts    # Groq API client
│   │   │   ├── claude-client.ts  # Anthropic Claude
│   │   │   └── llm-interface.ts  # Abstract LLM interface
│   │   ├── voice/                # Voice processing
│   │   │   ├── recorder.ts       # Audio recording
│   │   │   ├── transcription.ts  # Speech-to-text
│   │   │   └── synthesis.ts      # Text-to-speech
│   │   ├── code-tools/           # Code analysis/generation
│   │   │   ├── analyzer.ts       # Code analysis
│   │   │   ├── executor.ts       # Code execution
│   │   │   ├── refactor.ts       # Refactoring tools
│   │   │   └── search.ts         # Code search
│   │   ├── config/               # Configuration
│   │   │   ├── index.ts          # Config loader
│   │   │   └── validator.ts      # Config validation
│   │   ├── security/             # Security utilities
│   │   │   ├── auth.ts           # Authentication
│   │   │   ├── sanitizer.ts      # Input sanitization
│   │   │   └── secrets.ts        # Secrets management
│   │   └── utils/                # Shared utilities
│   │       ├── logger.ts         # Logging
│   │       ├── errors.ts         # Error handling
│   │       └── helpers.ts        # Common helpers
│   │
│   ├── interfaces/               # User interfaces
│   │   ├── cli/                  # Command-line interface
│   │   │   ├── index.ts          # CLI entry point
│   │   │   ├── commands/         # CLI commands
│   │   │   └── repl.ts           # Interactive mode
│   │   ├── tui/                  # Terminal UI
│   │   │   ├── index.ts          # TUI entry point
│   │   │   ├── components/       # UI components
│   │   │   └── screens/          # UI screens
│   │   ├── gui/                  # Electron GUI
│   │   │   ├── main/             # Electron main process
│   │   │   ├── renderer/         # Electron renderer
│   │   │   └── preload/          # Preload scripts
│   │   ├── web/                  # Web interface (Next.js)
│   │   │   └── (existing app/)   # Current Next.js app
│   │   └── api/                  # HTTP API
│   │       ├── index.ts          # API server
│   │       ├── routes/           # API routes
│   │       └── middleware/       # Middleware
│   │
│   ├── plugins/                  # Plugin system
│   │   ├── interface.ts          # Plugin interface
│   │   ├── manager.ts            # Plugin manager
│   │   └── examples/             # Example plugins
│   │
│   └── types/                    # TypeScript types
│       └── index.ts              # Type definitions
│
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── docs/                         # Documentation
│   ├── user/                     # User guides
│   ├── developer/                # Developer docs
│   └── api/                      # API documentation
│
├── scripts/                      # Build and deployment
│   ├── build-cli.sh             # Build CLI
│   ├── build-gui.sh             # Build GUI
│   ├── deploy-web.sh            # Deploy web
│   └── setup-dev.sh             # Dev setup
│
├── config/                       # Configuration files
│   ├── default.json             # Default config
│   ├── development.json         # Dev config
│   └── production.json          # Prod config
│
└── packages/                     # Desktop packages
    ├── windows/                 # Windows installer
    ├── macos/                   # macOS bundle
    └── linux/                   # Linux packages
```

## Core Principles

1. **Single Source of Truth**: All business logic in `src/core/`
2. **Interface Independence**: Each interface is a thin layer over core
3. **Plugin Architecture**: Extensible through plugins
4. **Security First**: No hardcoded secrets, input sanitization
5. **Type Safety**: Full TypeScript with strict mode
6. **Test Coverage**: Comprehensive testing at all levels
7. **Documentation**: Clear docs for users and developers

## Feature Parity

All interfaces support:
- Code generation and explanation
- Code refactoring and optimization
- Code search and navigation
- Multi-language support
- Voice and text input/output
- Session management
- Plugin extensions

## Security Model

- Environment-based configuration
- API key rotation support
- Input sanitization at all entry points
- Secure authentication for remote access
- Rate limiting on API endpoints
- Audit logging

## Technology Stack

- **Core**: TypeScript, Node.js
- **CLI**: Commander.js, Inquirer
- **TUI**: blessed, blessed-contrib
- **GUI**: Electron, React
- **Web**: Next.js, React (existing)
- **API**: Express, OpenAPI
- **AI**: Groq SDK, Anthropic SDK
- **Voice**: node-audiorecorder, say (TTS)
- **Testing**: Jest, Playwright
