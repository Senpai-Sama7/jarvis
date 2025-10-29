# JARVIS Web Application - Deployment Guide

## 🚀 Production-Ready Web Voice Assistant

Transform your voice into intelligent AI responses with this modern web application built with Next.js 14+, TypeScript, and Groq AI.

## ✨ Features

- 🎤 **Browser-based voice recording** with Web Audio API
- 🎨 **Real-time waveform visualization**
- 💬 **Live conversation history** with localStorage persistence
- 🌓 **Dark/Light mode** with smooth transitions
- 📱 **Fully responsive** mobile-first design
- 🔒 **Production security** with CSP headers, rate limiting, and input sanitization
- ⚡ **Fast transcription** using Groq's Whisper model
- 🤖 **Intelligent responses** from LLaMA 3.3 70B
- 🎯 **Accessible** with proper ARIA labels and keyboard navigation

## 🏗️ Architecture

```
jarvis/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # LLaMA chat API
│   │   └── transcribe/route.ts    # Whisper transcription API
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main voice interface
│   └── globals.css                # Global styles
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── VoiceRecorder.tsx          # Voice recording component
│   ├── ConversationHistory.tsx    # Chat history display
│   ├── Waveform.tsx               # Audio visualization
│   └── theme-provider.tsx         # Theme management
├── lib/
│   ├── groq-client.ts             # Server-only Groq SDK client
│   └── utils.ts                   # Utility functions
├── next.config.mjs                # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
└── vercel.json                    # Vercel deployment config
```

## 📋 Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Groq API key (get from [console.groq.com](https://console.groq.com/keys))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Senpai-Sama7/jarvis.git
cd jarvis
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add GROQ_API_KEY
   # Paste your Groq API key when prompted
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables in the Vercel dashboard:
   - `GROQ_API_KEY`: Your Groq API key
   - `GROQ_MODEL`: llama-3.3-70b-versatile
   - `WHISPER_MODEL`: whisper-large-v3
6. Deploy!

### Alternative: Deploy to Other Platforms

#### Netlify
```bash
npm run build
# Deploy the .next folder
```

#### Docker
```bash
docker build -t jarvis-web .
docker run -p 3000:3000 -e GROQ_API_KEY=your_key jarvis-web
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes | - |
| `GROQ_MODEL` | LLaMA model to use | No | llama-3.3-70b-versatile |
| `WHISPER_MODEL` | Whisper model for transcription | No | whisper-large-v3 |
| `NODE_ENV` | Environment mode | No | development |

### Security Features

- ✅ **API Keys**: Server-side only, never exposed to client
- ✅ **Rate Limiting**: 20 requests/minute for transcription, 30 for chat
- ✅ **Input Sanitization**: All user inputs sanitized
- ✅ **CSP Headers**: Content Security Policy configured
- ✅ **CORS**: Proper CORS configuration
- ✅ **File Validation**: Audio file type and size validation (max 25MB)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 📱 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note**: Requires HTTPS in production for microphone access.

## 🎨 Customization

### Theming

Edit `app/globals.css` to customize colors:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### Models

Change AI models in `.env.local`:

```env
GROQ_MODEL=llama-3.3-70b-versatile  # or mixtral-8x7b-32768
WHISPER_MODEL=whisper-large-v3      # or whisper-large-v3-turbo
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Add it to `.gitignore`
2. **Rotate API keys regularly** - Update in Vercel dashboard
3. **Use HTTPS in production** - Required for microphone access
4. **Monitor rate limits** - Check Groq dashboard for usage
5. **Keep dependencies updated** - Run `npm audit` regularly

## 📊 Performance

- **Initial Load**: ~200KB gzipped
- **Transcription**: 1-3 seconds (depends on audio length)
- **Chat Response**: 1-2 seconds
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)

## 🐛 Troubleshooting

### Microphone not working
- Ensure HTTPS is used (required by browsers)
- Check browser permissions for microphone access
- Try a different browser

### API errors
- Verify `GROQ_API_KEY` is set correctly
- Check Groq API status at [status.groq.com](https://status.groq.com)
- Ensure you have API credits available

### Build errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Check Node.js version (18+ required)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- **Documentation**: See README files in the repo
- **Issues**: [GitHub Issues](https://github.com/Senpai-Sama7/jarvis/issues)
- **Groq API**: [console.groq.com/docs](https://console.groq.com/docs)

## 🎓 Credits

- **Groq**: AI inference platform
- **Next.js**: React framework
- **shadcn/ui**: Component library
- **Tailwind CSS**: Styling
- **Vercel**: Deployment platform

---

**Built with ❤️ using Next.js 14+ and Groq AI**
