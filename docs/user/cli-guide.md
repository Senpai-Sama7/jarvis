# JARVIS CLI User Guide

## Overview

The JARVIS CLI (Command-Line Interface) provides a powerful terminal-based interface for interacting with the AI coding assistant. It supports both interactive chat mode and direct command execution.

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A Groq API key (get one at https://console.groq.com/keys)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Senpai-Sama7/jarvis.git
   cd jarvis
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the CLI:**
   ```bash
   npm run build:core
   ```

4. **Configure API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GROQ_API_KEY
   ```

5. **Run the CLI:**
   ```bash
   npm run start:cli
   # or directly:
   node dist/interfaces/cli/index.js
   ```

## Usage

### Interactive Mode

Start the interactive chat mode by running without arguments:

```bash
npm run start:cli
```

This starts a conversational interface where you can:
- Ask coding questions
- Get help with debugging
- Request code explanations
- Discuss programming concepts

**Commands in interactive mode:**
- `exit` or `quit` - Exit the chat
- `clear` - Clear conversation history
- `help` - Show help message

### Direct Commands

#### Generate Code

Generate code from a natural language description:

```bash
node dist/interfaces/cli/index.js generate "a function to sort an array of objects by date"
```

Options:
- `-l, --language <lang>` - Programming language (default: typescript)
- `-o, --output <file>` - Save to file

Examples:
```bash
# Generate TypeScript code
node dist/interfaces/cli/index.js generate "REST API endpoint for user authentication"

# Generate Python code and save to file
node dist/interfaces/cli/index.js generate "web scraper for news articles" -l python -o scraper.py

# Generate JavaScript code
node dist/interfaces/cli/index.js generate "React component for a todo list" -l javascript
```

#### Explain Code

Get a detailed explanation of a code file:

```bash
node dist/interfaces/cli/index.js explain path/to/file.ts
```

The explanation includes:
- What the code does
- Key functions and classes
- Important patterns used
- Potential issues or improvements

Example:
```bash
node dist/interfaces/cli/index.js explain src/core/ai/groq-client.ts
```

#### Refactor Code

Get refactoring suggestions for existing code:

```bash
node dist/interfaces/cli/index.js refactor path/to/file.ts
```

Options:
- `-s, --suggestion <text>` - Specific refactoring focus

Examples:
```bash
# General refactoring
node dist/interfaces/cli/index.js refactor src/utils/helpers.js

# Focused refactoring
node dist/interfaces/cli/index.js refactor app.js -s "improve error handling"
```

#### Review Code

Get a comprehensive code review:

```bash
node dist/interfaces/cli/index.js review path/to/file.ts
```

The review covers:
- Code quality and best practices
- Potential bugs
- Security concerns
- Performance considerations
- Improvement suggestions

Example:
```bash
node dist/interfaces/cli/index.js review src/api/routes.ts
```

#### Show Configuration

Display current configuration:

```bash
node dist/interfaces/cli/index.js config
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
GROQ_API_KEY=your_api_key_here

# Optional
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
LOG_LEVEL=info
```

### Configuration File

You can customize behavior with a `.jarvisrc.json` file:

```json
{
  "ai": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "maxTokens": 8000,
    "temperature": 0.7
  },
  "security": {
    "inputSanitization": {
      "enabled": true
    }
  }
}
```

Place this file in:
- Project root (`.jarvisrc.json`)
- `config/development.json` (for development)
- `config/production.json` (for production)

## Tips & Best Practices

### 1. Be Specific

More specific prompts lead to better results:

❌ Bad: "make a function"
✅ Good: "create a TypeScript function that validates email addresses using regex"

### 2. Use Interactive Mode for Exploration

When learning or exploring new concepts, use interactive mode for back-and-forth conversation:

```bash
npm run start:cli
```

### 3. Use Commands for Automation

For scripting and automation, use direct commands:

```bash
#!/bin/bash
# Generate multiple files
node dist/interfaces/cli/index.js generate "user model" -o models/user.ts
node dist/interfaces/cli/index.js generate "user controller" -o controllers/user.ts
```

### 4. Review Before Committing

Always review generated code before using it in production:

```bash
node dist/interfaces/cli/index.js generate "authentication middleware" -o middleware/auth.ts
node dist/interfaces/cli/index.js review middleware/auth.ts
```

### 5. Leverage Code Review

Use the review command to catch issues early:

```bash
# Review before committing
node dist/interfaces/cli/index.js review src/new-feature.ts
```

## Troubleshooting

### API Key Not Found

```
Error: GROQ_API_KEY environment variable is required
```

**Solution:** Make sure your `.env` file exists and contains your API key:
```bash
echo "GROQ_API_KEY=your_key_here" > .env
```

### File Not Found

```
Error: File not found: path/to/file.ts
```

**Solution:** Check that the file path is correct and the file exists.

### Permission Denied

```
Error: EACCES: permission denied
```

**Solution:** Make sure you have write permissions for output files:
```bash
chmod u+w output-directory/
```

### Module Not Found

```
Error: Cannot find module 'groq-sdk'
```

**Solution:** Install dependencies:
```bash
npm install
npm run build:core
```

## Examples

### Example 1: Full Workflow

```bash
# Generate a new feature
node dist/interfaces/cli/index.js generate "Express route for file uploads" -o routes/upload.ts

# Explain the generated code
node dist/interfaces/cli/index.js explain routes/upload.ts

# Review for issues
node dist/interfaces/cli/index.js review routes/upload.ts

# Refactor if needed
node dist/interfaces/cli/index.js refactor routes/upload.ts -s "add error handling"
```

### Example 2: Learning Mode

```bash
# Start interactive mode
npm run start:cli

# Ask questions:
💬 You: How do I implement JWT authentication in Express?
🤖 JARVIS: [provides detailed explanation]

💬 You: Show me example code
🤖 JARVIS: [provides code example]

💬 You: What about refresh tokens?
🤖 JARVIS: [explains refresh tokens]
```

### Example 3: Code Analysis

```bash
# Analyze multiple files
node dist/interfaces/cli/index.js review src/api/users.ts
node dist/interfaces/cli/index.js review src/api/auth.ts
node dist/interfaces/cli/index.js review src/api/posts.ts
```

## Advanced Usage

### Custom Configuration

Create environment-specific configs:

```bash
# config/development.json
{
  "ai": {
    "temperature": 0.8
  }
}

# config/production.json
{
  "ai": {
    "temperature": 0.3
  }
}

# Run with specific environment
NODE_ENV=production npm run start:cli
```

### Scripting

Create bash scripts for common tasks:

```bash
#!/bin/bash
# scripts/generate-crud.sh

ENTITY=$1

node dist/interfaces/cli/index.js generate "TypeScript interface for $ENTITY" -o models/${ENTITY}.ts
node dist/interfaces/cli/index.js generate "CRUD service for $ENTITY" -o services/${ENTITY}.service.ts
node dist/interfaces/cli/index.js generate "REST controller for $ENTITY" -o controllers/${ENTITY}.controller.ts

echo "Generated CRUD for $ENTITY"
```

Usage:
```bash
./scripts/generate-crud.sh User
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/Senpai-Sama7/jarvis/issues
- Documentation: See `docs/` directory
- Example usage: See `docs/user/examples.md`

## See Also

- [TUI Guide](tui-guide.md) - Terminal UI interface
- [API Guide](api-guide.md) - HTTP API reference
- [Developer Guide](../developer/contributing.md) - Contributing to JARVIS
