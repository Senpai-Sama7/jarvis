# JARVIS Remote Access Guide

**Control your computer from anywhere using the deployed website!**

---

## Overview

You can now use the GitHub Pages website as a **remote control interface** to access and control your computer/server running JARVIS.

**URL**: `https://senpai-sama7.github.io/jarvis/app.html`

---

## Setup (5 Minutes)

### Step 1: Start JARVIS API Server

On your computer/server:

```bash
cd /path/to/jarvis
npm run build:cli
npm run start:api
```

Server will start on: `http://localhost:8080`

### Step 2: Expose Server to Internet

Choose one method:

#### Option A: Ngrok (Easiest)

```bash
# Install
npm install -g ngrok

# Expose API
ngrok http 8080

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

#### Option B: Tailscale (Most Secure)

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start
sudo tailscale up

# Get your Tailscale IP
tailscale ip -4

# Use: http://YOUR-TAILSCALE-IP:8080
```

#### Option C: SSH Tunnel

```bash
# On your server
ssh -R 8080:localhost:8080 user@your-public-server

# Access via: http://your-public-server:8080
```

#### Option D: Port Forward (Home Network)

1. Log into your router
2. Forward port 8080 to your computer's local IP
3. Use: `http://YOUR-PUBLIC-IP:8080`

### Step 3: Add Authentication (Recommended)

Edit `.env`:
```bash
API_KEY=your_secure_random_key_here
```

Restart server:
```bash
npm run start:api
```

### Step 4: Access from Website

1. Visit: `https://senpai-sama7.github.io/jarvis/app.html`
2. Enter your server URL (from Step 2)
3. Enter API key (if you set one)
4. Click "Connect"

**You're now controlling your computer remotely!** 🚀

---

## Features

### 💬 Chat Interface
- Natural language commands
- Voice input (browser-based)
- AI-powered responses
- Conversation history

### ⚡ Code Execution
- Run JavaScript, Python, Bash, TypeScript
- Real-time output
- Multi-language support
- Syntax highlighting

### 📁 File Browser
- List files and directories
- Navigate filesystem
- View file contents
- Create/edit files

### 💻 Terminal
- Execute shell commands
- Real-time output
- Command history
- Full terminal access

---

## Usage Examples

### Example 1: Check System Status

1. Go to **Terminal** tab
2. Type: `df -h` (check disk space)
3. Type: `free -h` (check memory)
4. Type: `uptime` (check uptime)

### Example 2: Run Code

1. Go to **Execute** tab
2. Select language: Python
3. Enter code:
```python
import os
print(f"Current directory: {os.getcwd()}")
print(f"Files: {os.listdir('.')}")
```
4. Click "Execute"

### Example 3: Voice Control

1. Go to **Chat** tab
2. Click microphone button 🎤
3. Say: "List all JavaScript files"
4. JARVIS executes and responds

### Example 4: Deploy Website

1. Chat: "Deploy my website to production"
2. JARVIS: Generates deployment script
3. Executes: `git push`, `npm run build`, etc.
4. Shows results

---

## Security Best Practices

### ✅ Do This

1. **Use HTTPS** - Ngrok provides this automatically
2. **Set API Key** - Always use authentication
3. **Use Tailscale** - Most secure option
4. **Limit Commands** - Review what you execute
5. **Monitor Logs** - Check server logs regularly

### ❌ Don't Do This

1. ❌ Expose without authentication
2. ❌ Use HTTP on public internet
3. ❌ Share your API key
4. ❌ Run as root user
5. ❌ Execute untrusted code

---

## Troubleshooting

### Can't Connect

**Issue**: "Failed to connect"

**Solutions**:
1. Check server is running: `curl http://localhost:8080/health`
2. Check firewall allows port 8080
3. Verify URL is correct (include http:// or https://)
4. Check API key is correct

### CORS Errors

**Issue**: "CORS policy blocked"

**Solution**: Server already has CORS enabled. If still issues:
```javascript
// Server already includes:
res.header('Access-Control-Allow-Origin', '*');
```

### Commands Not Executing

**Issue**: Commands fail to run

**Solutions**:
1. Check working directory
2. Verify command is in whitelist
3. Check timeout settings
4. Review server logs

### Voice Input Not Working

**Issue**: Microphone button doesn't work

**Solutions**:
1. Use HTTPS (required for mic access)
2. Grant browser microphone permission
3. Use Chrome/Edge (best support)

---

## Advanced Setup

### Custom Domain

1. Get a domain (e.g., jarvis.yourdomain.com)
2. Point to your server IP
3. Set up SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d jarvis.yourdomain.com
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name jarvis.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Deployment

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build:cli
EXPOSE 8080
CMD ["npm", "run", "start:api"]
```

```bash
docker build -t jarvis .
docker run -p 8080:8080 -e GROQ_API_KEY=your_key jarvis
```

### Systemd Service

```ini
[Unit]
Description=JARVIS API Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/jarvis
ExecStart=/usr/bin/npm run start:api
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable jarvis
sudo systemctl start jarvis
```

---

## Mobile Access

### iOS/Android

1. Visit: `https://senpai-sama7.github.io/jarvis/app.html`
2. Add to Home Screen
3. Opens like native app
4. Full functionality

### PWA Features

- Offline capable
- Push notifications (future)
- Native app feel
- Fast loading

---

## Use Cases

### 1. Remote Development

- Code from anywhere
- Run tests remotely
- Deploy applications
- Monitor servers

### 2. System Administration

- Check server status
- Restart services
- View logs
- Update packages

### 3. Automation

- Schedule tasks
- Run scripts
- Monitor processes
- Backup data

### 4. Learning & Experimentation

- Try new languages
- Test code snippets
- Learn commands
- Practice DevOps

---

## Comparison

| Feature | JARVIS Remote | TeamViewer | SSH |
|---------|---------------|------------|-----|
| **Web-Based** | ✅ | ❌ | ❌ |
| **Voice Control** | ✅ | ❌ | ❌ |
| **AI-Assisted** | ✅ | ❌ | ❌ |
| **Code Execution** | ✅ | ⚠️ | ✅ |
| **Mobile Friendly** | ✅ | ⚠️ | ⚠️ |
| **No Install** | ✅ | ❌ | ❌ |
| **Free** | ✅ | ⚠️ | ✅ |

---

## FAQ

**Q: Is this secure?**  
A: Yes, with HTTPS and API key. Use Tailscale for maximum security.

**Q: Can multiple people connect?**  
A: Yes, but they'll share the same session.

**Q: Does it work on mobile?**  
A: Yes! Fully responsive and works great on phones/tablets.

**Q: Can I use it offline?**  
A: The website works offline, but needs internet to reach your server.

**Q: What about latency?**  
A: Depends on your connection. Usually < 100ms with good internet.

**Q: Can I customize the interface?**  
A: Yes! Edit `docs/app.html` and `docs/assets/css/app.css`

---

## Next Steps

1. **Set up remote access** using ngrok or Tailscale
2. **Add authentication** for security
3. **Bookmark the app** on your devices
4. **Create shortcuts** for common tasks
5. **Share with team** (optional)

---

**You can now control your computer from anywhere in the world!** 🌍

Visit: `https://senpai-sama7.github.io/jarvis/app.html`
