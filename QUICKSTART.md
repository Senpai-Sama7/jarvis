# JARVIS 2.0 Quick Start

## Overview

This guide gets you up and running with JARVIS 2.0 in 5 minutes.

## Prerequisites

- Node.js >= 18.0.0
- npm
- A Groq API key (free at https://console.groq.com/keys)

## Installation

### 1. Clone and Setup

```bash
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Core

```bash
npm run build:core
```

### 4. Configure API Key

```bash
# Create .env file
cat > .env << 'EOF'
GROQ_API_KEY=your_api_key_here
EOF
```

Replace `your_api_key_here` with your actual API key from https://console.groq.com/keys

## First Usage

### Option 1: Interactive Chat (CLI)

Start an interactive conversation:

```bash
npm run start:cli
```

You'll see:
```
🤖 JARVIS Interactive Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type your questions or commands. Type "exit" or "quit" to leave.

💬 You: _
```

Try asking:
- "How do I implement a binary search in Python?"
- "Explain promises in JavaScript"
- "What are SOLID principles?"

### Option 2: Direct Commands (CLI)

Generate code directly:

```bash
# Generate code
node dist/interfaces/cli/index.js generate "function to calculate fibonacci numbers"

# Explain code
echo "const x = [1,2,3].map(n => n * 2)" > example.js
node dist/interfaces/cli/index.js explain example.js

# Review code
node dist/interfaces/cli/index.js review example.js
```

### Option 3: HTTP API

Start the API server:

```bash
npm run start:api
```

In another terminal:

```bash
# Chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me with React?"}'

# Generate code
curl -X POST http://localhost:8080/api/code/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "REST API endpoint for user login", "language": "typescript"}'

# Health check
curl http://localhost:8080/health
```

### Option 4: Web Interface

Start the web interface:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Example Workflow

Here's a typical workflow using JARVIS:

```bash
# 1. Generate initial code
node dist/interfaces/cli/index.js generate "Express REST API with authentication" -o api.js

# 2. Review the generated code
node dist/interfaces/cli/index.js review api.js

# 3. Make improvements based on review
node dist/interfaces/cli/index.js refactor api.js -s "add error handling and validation"

# 4. Ask questions if needed
npm run start:cli
# Then: "How do I test this API?"
```

## Common Commands

### CLI Commands

```bash
# Interactive mode
npm run start:cli

# Generate code
node dist/interfaces/cli/index.js generate "<description>" [-l <language>] [-o <file>]

# Explain code
node dist/interfaces/cli/index.js explain <file>

# Refactor code
node dist/interfaces/cli/index.js refactor <file> [-s "<suggestion>"]

# Review code
node dist/interfaces/cli/index.js review <file>

# Show configuration
node dist/interfaces/cli/index.js config
```

### API Endpoints

```bash
# Chat
POST /api/chat
Body: {"message": "...", "conversationId": "...", "stream": false}

# Generate code
POST /api/code/generate
Body: {"description": "...", "language": "..."}

# Explain code
POST /api/code/explain
Body: {"code": "...", "language": "..."}

# Review code
POST /api/code/review
Body: {"code": "...", "language": "..."}

# Health check
GET /health

# API docs
GET /api/docs
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Required
GROQ_API_KEY=your_api_key

# Optional
AI_MODEL=llama-3.3-70b-versatile
API_PORT=8080
WEB_PORT=3000
LOG_LEVEL=info

# For API authentication (optional)
API_KEY=your_secure_api_key
```

### Config Files

Create `config/development.json` to override defaults:

```json
{
  "ai": {
    "temperature": 0.8,
    "maxTokens": 10000
  },
  "security": {
    "authentication": {
      "enabled": false
    }
  }
}
```

## Tips for Best Results

### 1. Be Specific

❌ Bad: "make a function"
✅ Good: "create a TypeScript function that validates email addresses using regex and returns a boolean"

### 2. Provide Context

When asking follow-up questions, provide context:

```
You: "I need to implement JWT authentication"
JARVIS: [explains JWT]
You: "Show me example code for Express with this approach"
```

### 3. Use the Right Interface

- **CLI** - Quick commands, automation, scripting
- **API** - Integration with other tools, programmatic access
- **Web** - Visual interface, file management, collaboration

### 4. Review Generated Code

Always review generated code before using in production:

```bash
node dist/interfaces/cli/index.js generate "..." -o code.js
node dist/interfaces/cli/index.js review code.js
```

## Troubleshooting

### "GROQ_API_KEY not found"

**Solution:** Make sure your `.env` file exists and contains your API key:
```bash
echo "GROQ_API_KEY=your_key" > .env
```

### "Cannot find module"

**Solution:** Build the core:
```bash
npm install
npm run build:core
```

### "Port already in use"

**Solution:** Change the port:
```bash
export API_PORT=8081
npm run start:api
```

Or kill the process using the port:
```bash
lsof -i :8080
kill -9 <PID>
```

### "Module not found" errors

**Solution:** Ensure you're in the right directory and dependencies are installed:
```bash
cd /path/to/jarvis
npm install
npm run build:core
ls dist/  # Should show compiled files
```

## Next Steps

### Learn More

- [CLI Guide](docs/user/cli-guide.md) - Comprehensive CLI documentation
- [API Guide](docs/user/api-guide.md) - API reference and examples
- [Architecture](ARCHITECTURE.md) - System architecture overview

### Customize

- Create plugins (see `src/plugins/examples/`)
- Customize configuration (see `config/default.json`)
- Integrate with your tools (use the HTTP API)

### Deploy

- [Deployment Guide](docs/user/deployment-guide.md) - Production deployment
- Docker, PM2, systemd, cloud platforms

### Contribute

- [GitHub](https://github.com/Senpai-Sama7/jarvis)
- Report issues, suggest features, submit PRs

## Example Use Cases

### 1. Learning New Concepts

```bash
npm run start:cli
# Ask: "Explain microservices architecture"
# Ask: "Show me example code"
# Ask: "What are the trade-offs?"
```

### 2. Code Generation

```bash
# Generate multiple related files
node dist/interfaces/cli/index.js generate "User model with validation" -o models/user.ts
node dist/interfaces/cli/index.js generate "User service with CRUD" -o services/user.service.ts
node dist/interfaces/cli/index.js generate "User controller with REST endpoints" -o controllers/user.controller.ts
```

### 3. Code Review

```bash
# Review before committing
git diff --name-only | while read file; do
  node dist/interfaces/cli/index.js review "$file"
done
```

### 4. Refactoring

```bash
# Refactor old code
node dist/interfaces/cli/index.js refactor legacy-code.js -s "modernize to ES6+"
```

### 5. API Integration

```javascript
// Integrate JARVIS into your app
const axios = require('axios');

async function generateCode(description) {
  const response = await axios.post('http://localhost:8080/api/code/generate', {
    description,
    language: 'javascript'
  });
  return response.data.code;
}

// Use it
const code = await generateCode('function to sort array of dates');
console.log(code);
```

## Getting Help

- **Documentation:** See `docs/` directory
- **Issues:** https://github.com/Senpai-Sama7/jarvis/issues
- **Discussions:** https://github.com/Senpai-Sama7/jarvis/discussions

---

**Ready to start?** Run `npm run start:cli` and say hello to JARVIS! 🚀
