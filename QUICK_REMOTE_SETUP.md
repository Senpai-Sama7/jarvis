# Quick Remote Setup (2 Minutes)

## Control Your Computer from the Deployed Website

### Step 1: Start Server (30 seconds)
```bash
cd /path/to/jarvis
npm run start:api
```

### Step 2: Expose to Internet (1 minute)
```bash
# Install ngrok
npm install -g ngrok

# Expose
ngrok http 8080

# Copy the HTTPS URL shown
```

### Step 3: Connect (30 seconds)

1. Visit: **https://senpai-sama7.github.io/jarvis/app.html**
2. Paste your ngrok URL
3. Click "Connect"

**Done!** You're now controlling your computer remotely! 🚀

---

## What You Can Do

- 💬 **Chat** - Talk to AI, get code help
- ⚡ **Execute** - Run code in any language
- 📁 **Files** - Browse and manage files
- 💻 **Terminal** - Full command line access
- 🎤 **Voice** - Speak commands (works in browser!)

---

## Security (Optional but Recommended)

Add to `.env`:
```bash
API_KEY=your_random_secure_key
```

Then enter this key when connecting.

---

**That's it!** See `REMOTE_ACCESS_GUIDE.md` for advanced setup.
