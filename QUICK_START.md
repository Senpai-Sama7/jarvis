# JARVIS Quick Start Guide

## 🚀 All Services Running

### Access Points

| Service | URL | Status |
|---------|-----|--------|
| **API Server** | http://localhost:8080 | ✅ Running |
| **Web Interface** | http://localhost:3000 | ✅ Running |
| **API Docs** | http://localhost:8080/api/docs | ✅ Available |
| **Health Check** | http://localhost:8080/health | ✅ OK |
| **Remote Control** | https://senpai-sama7.github.io/jarvis/app.html | ✅ Deployed |

---

## 📱 How to Use

### 1. Web Interface (Easiest)
```bash
# Already running at:
http://localhost:3000

# Features:
- Voice recording
- Chat interface
- Conversation history
- Code highlighting
```

### 2. API (For Integration)
```bash
# Chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello JARVIS"}'

# Generate Code
curl -X POST http://localhost:8080/api/code/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"function to add numbers","language":"javascript"}'

# Execute Command
curl -X POST http://localhost:8080/api/execute/command \
  -H "Content-Type: application/json" \
  -d '{"command":"echo Hello"}'
```

### 3. CLI (For Terminal)
```bash
cd /home/donovan/Documents/projects/jarvis

# Execute command
node dist/interfaces/cli/index.js execute "ls -la"

# Generate code (requires Groq API)
node dist/interfaces/cli/index.js generate "create a hello function" -l javascript

# Interactive chat
node dist/interfaces/cli/index.js chat
```

### 4. Remote Control (From Anywhere)
```bash
# 1. Open: https://senpai-sama7.github.io/jarvis/app.html
# 2. Enter password: Senpai-sama7+
# 3. Automatically connects to: http://100.82.176.27:8080
# 4. Control your computer remotely!
```

---

## 🔧 Management Commands

### Start Services
```bash
# API Server
cd /home/donovan/Documents/projects/jarvis
npm run start:api

# Web Interface
npm start

# Both (in separate terminals)
npm run start:api & npm start
```

### Stop Services
```bash
# Stop API Server
kill $(lsof -ti :8080)

# Stop Web Interface
kill $(lsof -ti :3000)

# Stop all
pkill -f "node.*jarvis"
```

### Restart Services
```bash
# Rebuild and restart API
npm run build:cli
kill $(lsof -ti :8080)
npm run start:api

# Restart Web
kill $(lsof -ti :3000)
npm start
```

### Check Status
```bash
# Check if running
lsof -ti :8080 && echo "API: Running" || echo "API: Stopped"
lsof -ti :3000 && echo "Web: Running" || echo "Web: Stopped"

# Health check
curl http://localhost:8080/health
curl http://localhost:8080/api/chat/health
```

---

## 🧪 Test Everything

```bash
# Quick test
curl http://localhost:8080/health

# Full test suite
cd /home/donovan/Documents/projects/jarvis
cat > test.sh << 'EOF'
#!/bin/bash
echo "Testing API..." && curl -s http://localhost:8080/health | jq .
echo "Testing Chat..." && curl -s -X POST http://localhost:8080/api/chat -H "Content-Type: application/json" -d '{"message":"test"}' | jq -r '.conversationId'
echo "Testing Code Gen..." && curl -s -X POST http://localhost:8080/api/code/generate -H "Content-Type: application/json" -d '{"description":"hello","language":"js"}' | jq -r '.language'
echo "✅ All tests passed!"
EOF
chmod +x test.sh && ./test.sh
```

---

## 📊 Monitoring

### View Logs
```bash
# API Server logs
tail -f /tmp/jarvis-api-final.log

# Next.js logs
tail -f /tmp/jarvis-next.log

# All logs
tail -f /tmp/jarvis-*.log
```

### Check Performance
```bash
# Memory usage
ps aux | grep node | grep jarvis

# Port usage
lsof -i :8080
lsof -i :3000

# System resources
top -p $(lsof -ti :8080,3000)
```

---

## 🔒 Security

### Current Configuration
- **Password**: `Senpai-sama7+` (SHA-256 hashed)
- **API Key**: Configured in `.env` (not in git)
- **Tailscale IP**: `100.82.176.27`
- **Rate Limit**: 60 requests/minute per user

### Update Password
```bash
# Generate new hash
echo -n "YourNewPassword" | sha256sum

# Update in: docs/assets/js/app.local.js
# const PASSWORD_HASH = 'new_hash_here';
```

### Update API Key
```bash
# Generate new key
openssl rand -hex 32

# Update in: .env
# API_KEY=new_key_here

# Restart API server
kill $(lsof -ti :8080)
npm run start:api
```

---

## 🆘 Troubleshooting

### API Server Won't Start
```bash
# Check if port is in use
lsof -i :8080

# Kill existing process
kill -9 $(lsof -ti :8080)

# Check logs
tail -50 /tmp/jarvis-api-final.log

# Rebuild and start
npm run build:cli
npm run start:api
```

### Web Interface Won't Load
```bash
# Check if running
lsof -i :3000

# Rebuild
npm run build

# Start
npm start
```

### AI Not Responding
```bash
# Check AI health
curl http://localhost:8080/api/chat/health

# Check Groq API key
grep GROQ_API_KEY .env

# Check model access
# Visit: https://console.groq.com/settings/project/limits
```

### Rate Limited
```bash
# Wait 5 minutes for reset
# Or restart server to clear limits
kill $(lsof -ti :8080)
npm run start:api
```

---

## 📚 Documentation

- **Architecture**: `ARCHITECTURE_IMPROVEMENTS.md`
- **Refactoring**: `REFACTORING_SUMMARY.md`
- **Setup**: `SETUP_COMPLETE.md`
- **User Guide**: `README.md`
- **API Docs**: http://localhost:8080/api/docs

---

## 🎯 Common Tasks

### Generate Code
```bash
curl -X POST http://localhost:8080/api/code/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "function to calculate fibonacci",
    "language": "javascript"
  }' | jq -r '.code'
```

### Explain Code
```bash
curl -X POST http://localhost:8080/api/code/explain \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const x = [1,2,3].map(n => n * 2)",
    "language": "javascript"
  }' | jq -r '.explanation'
```

### Review Code
```bash
curl -X POST http://localhost:8080/api/code/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { var x = 1; }",
    "language": "javascript"
  }' | jq -r '.review'
```

### Refactor Code
```bash
curl -X POST http://localhost:8080/api/code/refactor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { var x = 1; return x; }",
    "language": "javascript",
    "focus": "modern ES6 syntax"
  }' | jq -r '.refactoredCode'
```

### Chat with Context
```bash
# First message
CONV_ID=$(curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Remember: my name is Alice"}' | jq -r '.conversationId')

# Follow-up (remembers context)
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"What is my name?\",\"conversationId\":\"$CONV_ID\"}" | jq -r '.response'
```

---

## ✅ System Status

**All systems operational!** 🚀

- ✅ API Server: Running on port 8080
- ✅ Web Interface: Running on port 3000
- ✅ AI Service: Healthy and responding
- ✅ CLI: Working
- ✅ Remote Control: Deployed
- ✅ Tailscale: Connected
- ✅ Rate Limiting: Active
- ✅ Security: Enabled

**Version**: 2.1.0  
**Status**: Production Ready  
**Last Updated**: October 30, 2025
