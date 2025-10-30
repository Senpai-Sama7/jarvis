# JARVIS Code Execution Guide

**Status**: ✅ Full AI Agent Capabilities  
**Features**: Remote execution, Voice input, Claude Code equivalent

---

## Overview

JARVIS can now execute code and commands on your system, just like Claude Code and Codex CLI, but with:
- 🎤 **Voice input** support
- 🌐 **Remote access** via API
- 🤖 **AI-assisted** command generation
- 🔒 **Security** controls

---

## Capabilities

### 1. Execute Shell Commands
Run any shell command on your system:

```bash
# CLI
jarvis execute "ls -la"
jarvis execute "git status" --cwd /path/to/repo

# API
curl -X POST http://localhost:8080/api/execute/command \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la"}'
```

### 2. Execute Code
Run code in multiple languages:

```bash
# CLI
jarvis ai-execute "create a hello world in Python"

# API
curl -X POST http://localhost:8080/api/execute/code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")",
    "language": "python"
  }'
```

**Supported Languages**:
- JavaScript/Node.js
- TypeScript
- Python
- Bash/Shell

### 3. AI-Assisted Execution
Let AI generate and execute commands:

```bash
# CLI
jarvis ai-execute "list all JavaScript files in current directory"
jarvis ai-execute "create a simple HTTP server" --dry-run

# API
curl -X POST http://localhost:8080/api/execute/ai-execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "list all files modified today"}'
```

### 4. File Operations
Create, read, and list files:

```bash
# Create file
curl -X POST http://localhost:8080/api/execute/file/create \
  -H "Content-Type: application/json" \
  -d '{
    "filepath": "test.js",
    "content": "console.log(\"Hello\");"
  }'

# Read file
curl http://localhost:8080/api/execute/file/read?filepath=test.js

# List files
curl http://localhost:8080/api/execute/file/list?dirpath=.
```

---

## Voice-Enabled Execution

### Using Voice Assistant

```bash
# Start voice mode
npm run start:voice

# Then speak:
"Execute command: list all files"
"Run Python code to calculate fibonacci"
"Create a new Express server"
```

### Voice + Remote Access

1. **Start API server**:
```bash
npm run build:cli
npm run start:api
```

2. **Use voice from web app**:
   - Open http://localhost:3000
   - Click microphone
   - Say: "Execute: git status"
   - JARVIS will transcribe and execute

---

## Remote Access Setup

### 1. Local Network Access

```bash
# Start API server
npm run start:api

# Access from other devices on same network
curl http://YOUR_IP:8080/api/execute/command \
  -H "Content-Type: application/json" \
  -d '{"command": "pwd"}'
```

### 2. Secure Remote Access (Recommended)

**Option A: SSH Tunnel**
```bash
# On remote machine
ssh -R 8080:localhost:8080 user@your-server

# Now accessible at your-server:8080
```

**Option B: Ngrok**
```bash
# Install ngrok
npm install -g ngrok

# Expose API
ngrok http 8080

# Use the ngrok URL
curl https://YOUR-ID.ngrok.io/api/execute/command \
  -H "Content-Type: application/json" \
  -d '{"command": "ls"}'
```

**Option C: Tailscale (Best)**
```bash
# Install Tailscale
# Access via Tailscale IP from anywhere
```

### 3. Add Authentication

Edit `.env`:
```bash
API_KEY=your_secure_api_key_here
```

Then use:
```bash
curl http://localhost:8080/api/execute/command \
  -H "Authorization: Bearer your_secure_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"command": "ls"}'
```

---

## API Endpoints

### Execute Command
```
POST /api/execute/command
Body: {
  "command": "ls -la",
  "cwd": "/path/to/dir",
  "timeout": 10000
}
```

### Execute Code
```
POST /api/execute/code
Body: {
  "code": "console.log('hello')",
  "language": "javascript",
  "cwd": "/path/to/dir"
}
```

### AI Execute
```
POST /api/execute/ai-execute
Body: {
  "prompt": "list all Python files",
  "context": "optional context"
}
```

### File Operations
```
POST /api/execute/file/create
Body: {"filepath": "test.txt", "content": "hello"}

GET /api/execute/file/read?filepath=test.txt

GET /api/execute/file/list?dirpath=.
```

### Working Directory
```
GET /api/execute/workdir
POST /api/execute/workdir
Body: {"workdir": "/new/path"}
```

---

## CLI Commands

```bash
# Execute command
jarvis execute "npm install"
jarvis execute "git status" --cwd /path/to/repo

# AI-assisted execution
jarvis ai-execute "create a REST API"
jarvis ai-execute "list large files" --dry-run

# With voice (in voice mode)
"Execute: npm test"
"Run: python script.py"
```

---

## Security Features

### 1. Command Whitelist
Safe commands allowed by default:
- `ls`, `cat`, `echo`, `pwd`, `whoami`, `date`
- `node`, `npm`, `python`, `git`
- `mkdir`, `touch`, `cp`, `mv`, `rm`

### 2. Blocked Commands
Dangerous commands blocked:
- `rm -rf /`
- `dd`, `mkfs`, `format`
- Fork bombs

### 3. Timeouts
- Default: 10 seconds
- Maximum: 30 seconds
- Prevents hanging processes

### 4. Working Directory
- Isolated to specific directory
- No access outside workdir by default

### 5. Authentication
- Optional API key
- Rate limiting
- Input sanitization

---

## Use Cases

### 1. Development Workflow
```bash
# Voice: "Run tests"
# Executes: npm test

# Voice: "Deploy to staging"
# Executes: git push staging main
```

### 2. System Administration
```bash
# Voice: "Check disk space"
# Executes: df -h

# Voice: "Show running processes"
# Executes: ps aux
```

### 3. Code Generation & Execution
```bash
# Voice: "Create a web scraper for news"
# AI generates Python code
# Executes and shows results
```

### 4. Remote Development
```bash
# From phone/tablet via API
# Execute commands on dev machine
# Get results instantly
```

---

## Comparison with Claude Code / Codex CLI

| Feature | JARVIS | Claude Code | Codex CLI |
|---------|--------|-------------|-----------|
| **Voice Input** | ✅ Yes | ❌ No | ❌ No |
| **Remote Access** | ✅ API | ❌ Local only | ❌ Local only |
| **Execute Commands** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Execute Code** | ✅ Yes | ✅ Yes | ✅ Yes |
| **AI-Assisted** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Multi-Language** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Web Interface** | ✅ Yes | ❌ No | ❌ No |
| **File Operations** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Security Controls** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Open Source** | ✅ Yes | ❌ No | ❌ No |

---

## Examples

### Example 1: Voice-Controlled Development

```bash
# Start voice mode
npm run start:voice

# Speak:
"Create a new React component called UserProfile"
# AI generates code and saves to file

"Run the development server"
# Executes: npm run dev

"Show me the git status"
# Executes: git status
```

### Example 2: Remote Code Execution

```python
# From Python script
import requests

response = requests.post(
    'http://your-server:8080/api/execute/ai-execute',
    json={'prompt': 'analyze log files for errors'},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)

print(response.json())
```

### Example 3: Automated Tasks

```bash
# Voice: "Set up a cron job to backup database daily"
# AI generates:
# 1. Backup script
# 2. Cron configuration
# 3. Executes setup
```

---

## Safety Guidelines

### ✅ Safe Practices
- Use authentication for remote access
- Set appropriate working directory
- Review AI-generated commands before execution
- Use `--dry-run` to preview
- Keep API key secure

### ⚠️ Warnings
- Don't expose API publicly without auth
- Review destructive commands
- Limit timeout values
- Monitor execution logs
- Use HTTPS for remote access

---

## Troubleshooting

### Command Not Allowed
**Issue**: "Command not allowed for security reasons"  
**Solution**: Command is blocked. Use `--force` or add to whitelist

### Timeout Error
**Issue**: Command times out  
**Solution**: Increase timeout: `--timeout 30000`

### Permission Denied
**Issue**: Can't execute command  
**Solution**: Check file permissions or run with appropriate user

### API Connection Failed
**Issue**: Can't reach API  
**Solution**: Check if server is running, firewall settings

---

## Next Steps

1. **Enable remote access** with ngrok or Tailscale
2. **Add authentication** for security
3. **Create custom commands** for your workflow
4. **Integrate with CI/CD** pipelines
5. **Build automation** scripts

---

**JARVIS is now a full AI agent with execution capabilities!** 🚀

Use voice, CLI, or API to control your system remotely.
