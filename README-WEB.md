# 🎙️ JARVIS - AI Voice Assistant Web Application

A production-ready web-based voice assistant powered by Groq's Whisper and LLaMA models, providing intelligent AI interaction through natural speech in your browser.

![JARVIS Web Interface](https://github.com/user-attachments/assets/914d079a-1069-4ac9-9259-393e8864e234)

## ✨ Features

### 🌐 Web Interface
- **Browser-based voice recording** using Web Audio API
- **Real-time waveform visualization** for audio feedback
- **Live conversation history** with localStorage persistence
- **Dark/Light mode** with smooth theme transitions
- **Fully responsive** mobile-first design
- **Accessible** with proper ARIA labels

### 🤖 AI Capabilities
- **Fast transcription** using Groq's Whisper model
- **Intelligent responses** from LLaMA 3.3 70B
- **Conversation context** maintained across messages
- **Real-time processing** with visual feedback

### 🔒 Security Features
- ✅ **API keys server-side only** - Never exposed to client
- ✅ **Input sanitization** on all endpoints
- ✅ **Rate limiting** (20 req/min transcription, 30 req/min chat)
- ✅ **CORS configuration** with proper headers
- ✅ **CSP headers** for content security
- ✅ **File validation** (type & size checks)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm or yarn
- Groq API key from [console.groq.com](https://console.groq.com/keys)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Groq API key

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration

Edit `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
NODE_ENV=development
```

## 📦 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Senpai-Sama7/jarvis)

**Manual deployment:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Set environment variables
vercel env add GROQ_API_KEY

# 4. Deploy
vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including other platforms.

## 🏗️ Architecture

```
jarvis/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # LLaMA chat API endpoint
│   │   └── transcribe/route.ts    # Whisper transcription API
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main voice interface
│   └── globals.css                # Global styles & theme
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── VoiceRecorder.tsx          # Voice recording with Web Audio API
│   ├── ConversationHistory.tsx    # Chat history with localStorage
│   ├── Waveform.tsx               # Real-time audio visualization
│   └── theme-provider.tsx         # Theme management
├── lib/
│   ├── groq-client.ts             # Server-only Groq SDK client
│   └── utils.ts                   # Utility functions & sanitization
├── next.config.mjs                # Next.js with security headers
├── tailwind.config.ts             # Tailwind CSS configuration
└── vercel.json                    # Vercel deployment config
```

## 💻 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **AI Provider:** Groq (Whisper + LLaMA 3.3)
- **Audio:** Web Audio API
- **Theme:** next-themes
- **Deployment:** Vercel-ready

## 🎯 Usage

1. **Click the microphone button** to start recording
2. **Speak your message** - the waveform shows audio input
3. **Click again to stop** recording
4. **Wait for processing** - transcription + AI response
5. **View conversation** in the history panel
6. **Clear history** anytime with the Clear button

**Browser Requirements:**
- HTTPS required (for microphone access in production)
- Modern browser with Web Audio API support
- Chrome/Edge 90+, Firefox 88+, Safari 14+

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📱 Browser Support

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** Microphone access requires HTTPS in production.

## 🎨 Customization

### Change Theme Colors

Edit `app/globals.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... customize other colors */
}
```

### Change AI Models

Edit `.env.local`:

```env
GROQ_MODEL=llama-3.3-70b-versatile  # or mixtral-8x7b-32768
WHISPER_MODEL=whisper-large-v3      # or whisper-large-v3-turbo
```

## 🔒 Security

This application implements production-grade security:

- **Server-side API keys** - Never exposed to browser
- **Input sanitization** - XSS prevention on all inputs
- **Rate limiting** - Prevents abuse (configurable)
- **CSP headers** - Content Security Policy configured
- **CORS protection** - Proper origin validation
- **File validation** - Type and size checks (max 25MB)

**Best Practices:**
1. Never commit `.env.local` to git
2. Rotate API keys regularly
3. Use HTTPS in production (required for mic access)
4. Monitor rate limits in Groq dashboard
5. Keep dependencies updated

## 📊 Performance

- **Initial Load:** ~200KB gzipped
- **Transcription:** 1-3 seconds (audio length dependent)
- **Chat Response:** 1-2 seconds
- **Lighthouse Score:** 95+ across all metrics

## 🐛 Troubleshooting

### Microphone not working
- Ensure you're using HTTPS (required by browsers)
- Check browser permissions for microphone
- Try a different browser

### API errors
- Verify `GROQ_API_KEY` is set correctly
- Check [Groq API status](https://status.groq.com)
- Ensure you have available API credits

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📄 Legacy CLI Version

The original Node.js CLI version is still available:

```bash
# For legacy CLI usage
./jarvis
```

See the [CLI section in README.md](README.md#cli-application-original) for CLI features.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Groq Console:** [console.groq.com](https://console.groq.com/)
- **Groq Docs:** [console.groq.com/docs](https://console.groq.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎓 Credits

Built with:
- [Groq](https://groq.com/) - Lightning-fast AI inference
- [Next.js](https://nextjs.org/) - React framework
- [Whisper](https://openai.com/research/whisper) - Speech recognition
- [LLaMA 3.3](https://ai.meta.com/llama/) - Language model
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vercel](https://vercel.com/) - Deployment platform

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Senpai-Sama7/jarvis/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Senpai-Sama7/jarvis/discussions)
- **Documentation:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Built with ❤️ using Next.js 14+ and Groq AI**

*Transform your voice into intelligent responses with JARVIS - the production-ready AI voice assistant for the web.*
