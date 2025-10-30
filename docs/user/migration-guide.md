# Migration Guide: JARVIS 1.0 to 2.0

## Overview

This guide helps you migrate from the original JARVIS implementation to the new multi-interface architecture.

## What's Changed

### Architecture

**Before (v1.0):**
- Monolithic structure with duplicated code
- Multiple standalone scripts (`jarvis.js`, `enhanced-jarvis.js`, etc.)
- No clear separation of concerns
- Hardcoded configurations

**After (v2.0):**
- Modular architecture with unified core
- Multiple interfaces (CLI, TUI, GUI, Web, API)
- Clear separation: core, interfaces, plugins
- Configuration-driven design

### Security

**Before:**
- API keys potentially exposed in code
- No input sanitization
- Command injection vulnerabilities

**After:**
- Environment-based secrets management
- Comprehensive input sanitization
- Security middleware for all interfaces
- No hardcoded secrets

### Features

**New in v2.0:**
- HTTP API for programmatic access
- Plugin system for extensibility
- Type safety with TypeScript
- Comprehensive test coverage
- Multi-interface support

## Migration Steps

### 1. Backup Current Installation

```bash
# Backup your current JARVIS directory
cp -r jarvis jarvis-v1-backup

# Backup your conversations
cp -r jarvis/*.json jarvis-v1-backup/ 2>/dev/null || true
```

### 2. Update Repository

```bash
cd jarvis
git fetch origin
git checkout main
git pull
```

### 3. Install New Dependencies

```bash
# Remove old node_modules
rm -rf node_modules package-lock.json

# Install new dependencies
npm install

# Build the core
npm run build:core
```

### 4. Migrate Configuration

**Old `.env` file:**
```env
GROQ_API_KEY=your_key
```

**New `.env` file (same, but cleaner):**
```env
# Required
GROQ_API_KEY=your_key

# Optional (new features)
ANTHROPIC_API_KEY=your_anthropic_key
API_KEY=your_api_authentication_key
API_PORT=8080
WEB_PORT=3000
LOG_LEVEL=info
```

### 5. Migrate Conversation History

If you have conversation history files:

```bash
# Old location: ./*.json
# New location: ./data/conversations/*.json

mkdir -p data/conversations
mv jarvis-v1-backup/*.json data/conversations/ 2>/dev/null || true
```

### 6. Update Scripts

**Old usage:**
```bash
# Old way
./jarvis
node jarvis.js
node enhanced-jarvis.js
```

**New usage:**
```bash
# New way - CLI
npm run start:cli
node dist/interfaces/cli/index.js

# New way - API
npm run start:api

# New way - Web
npm run dev
```

### 7. Update Custom Integrations

If you have custom scripts that use JARVIS:

**Old:**
```javascript
const { getChatResponse } = require('./voice-core');

async function myFunction() {
  const response = await getChatResponse([...]);
}
```

**New:**
```javascript
import { createGroqClient } from './dist/core/ai/groq-client';

async function myFunction() {
  const client = createGroqClient(process.env.GROQ_API_KEY);
  const response = await client.chat({
    messages: [...],
  });
}
```

Or use the HTTP API:

```javascript
const axios = require('axios');

async function myFunction() {
  const response = await axios.post('http://localhost:8080/api/chat', {
    message: 'Your prompt here',
  });
  
  return response.data.message;
}
```

## Feature Mapping

### Voice Functionality

**Old:**
```bash
./jarvis  # Started voice mode
```

**New:**
```bash
# Voice features are being migrated
# For now, use CLI interactive mode:
npm run start:cli

# Or voice-enabled chat:
node dist/interfaces/cli/index.js chat --voice
```

Note: Full voice integration is coming in a future update.

### Commands

| Old | New |
|-----|-----|
| `./jarvis` | `npm run start:cli` |
| `node enhanced-jarvis.js` | `npm run start:cli` |
| Manual curl commands | `npm run start:api` + HTTP requests |
| N/A | `npm run dev` (web interface) |

### Code Operations

**Old:**
No direct commands, needed to chat with JARVIS

**New:**
```bash
# Generate code
node dist/interfaces/cli/index.js generate "description"

# Explain code
node dist/interfaces/cli/index.js explain file.ts

# Review code
node dist/interfaces/cli/index.js review file.ts

# Refactor code
node dist/interfaces/cli/index.js refactor file.ts
```

## Configuration Changes

### Old Configuration

Configuration was scattered across files or hardcoded:
- `voice-core.js` had hardcoded values
- Environment variables in multiple places
- No validation

### New Configuration

Centralized configuration system:

**`config/default.json`:**
```json
{
  "ai": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "maxTokens": 8000,
    "temperature": 0.7
  },
  "voice": {
    "input": {
      "enabled": true,
      "model": "whisper-large-v3"
    }
  },
  "security": {
    "rateLimiting": {
      "enabled": true,
      "maxRequests": 100,
      "windowMs": 60000
    }
  }
}
```

Override with:
- Environment variables (highest priority)
- `config/production.json` or `config/development.json`
- `.jarvisrc.json` in project root

## API Changes

### Old Internal API (voice-core.js)

```javascript
const { getChatResponse, transcribe } = require('./voice-core');
```

### New Internal API

```typescript
import { createGroqClient } from './src/core/ai/groq-client';
import { loadConfig } from './src/core/config';

const config = loadConfig();
const client = createGroqClient(apiKey, config.ai.model);
```

### New HTTP API

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## Breaking Changes

### 1. Module System

**Breaking:** CommonJS modules converted to TypeScript

**Migration:** Use the compiled JavaScript in `dist/` or import TypeScript directly

### 2. File Structure

**Breaking:** Files moved from root to `src/`

**Migration:** Update import paths:
- Old: `require('./voice-core')`
- New: `require('./dist/core/voice/...')`

### 3. Environment Variables

**No breaking changes**, but new optional variables available:
- `API_KEY` - For API authentication
- `API_PORT` - API server port
- `WEB_PORT` - Web server port
- `LOG_LEVEL` - Logging verbosity

### 4. Function Signatures

Some internal functions have changed signatures. If you were using:

```javascript
// Old
const result = await getChatResponse(messages);

// New
const client = createGroqClient(apiKey);
const result = await client.chat({ messages });
```

## Testing Your Migration

### 1. Test CLI

```bash
npm run start:cli
# Try asking a question
```

### 2. Test API

```bash
# Start API
npm run start:api

# In another terminal:
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### 3. Test Web Interface

```bash
npm run dev
# Open http://localhost:3000
```

## Rollback Procedure

If you need to rollback:

```bash
# Stop new services
pm2 stop all  # or Ctrl+C

# Restore backup
cd ..
mv jarvis jarvis-v2-failed
mv jarvis-v1-backup jarvis
cd jarvis

# Restart old version
./jarvis
```

## Getting Help

### Common Issues

**Build errors:**
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build:core
```

**Port conflicts:**
```bash
# Change ports in .env
API_PORT=8081
WEB_PORT=3001
```

**Module not found:**
```bash
# Ensure build is complete
npm run build:core
ls -la dist/  # Should show compiled files
```

### Support Resources

- [GitHub Issues](https://github.com/Senpai-Sama7/jarvis/issues)
- [Documentation](../README-NEW.md)
- [CLI Guide](cli-guide.md)
- [API Guide](api-guide.md)

## Post-Migration Checklist

- [ ] Old JARVIS backed up
- [ ] New version installed and built
- [ ] Environment variables configured
- [ ] API key working
- [ ] CLI tested and working
- [ ] API tested (if using)
- [ ] Web interface tested (if using)
- [ ] Custom integrations updated
- [ ] Conversation history migrated
- [ ] Old version removed (optional)

## Next Steps

After successful migration:

1. **Explore new features:**
   - Try the HTTP API
   - Explore the web interface
   - Test the new CLI commands

2. **Security improvements:**
   - Enable API authentication
   - Review security documentation
   - Update any exposed credentials

3. **Optimization:**
   - Configure rate limiting
   - Set up monitoring
   - Optimize for your use case

4. **Extend:**
   - Create custom plugins
   - Build integrations
   - Contribute improvements

## Timeline

- **v1.0:** Original implementation
- **v2.0:** Multi-interface architecture (current)
- **v2.1:** TUI and GUI interfaces (planned)
- **v2.2:** Enhanced voice integration (planned)
- **v3.0:** Full plugin marketplace (planned)

---

For questions or issues during migration, please open an issue on GitHub.
