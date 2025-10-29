# JARVIS Code Audit - Part 2: Security & Architecture

## 1.3 HIGH: File System Vulnerabilities

**Severity**: HIGH  
**CVSS Score**: 7.5 (High)  
**Files Affected**: All files creating temp files, `voice-core.js` save/load functions

#### Issue Description

**Predictable Temp File Names**:
```javascript
// jarvis.js:115
const audioFile = `/tmp/jarvis-audio-${Date.now()}.wav`;
```
- Race condition: Multiple processes could create same filename
- Predictable names enable symlink attacks
- No cleanup on crash leaves sensitive audio data

**Unsafe File Operations**:
```javascript
// voice-core.js:244
function saveConversation(history, filename) {
  const filePath = `${os.homedir()}/.jarvis/${filename || 'jarvis-conversation.json'}`;
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
}
```
- No path traversal prevention
- User could inject `../../etc/passwd` as filename
- No file permission checks
- Overwrites without confirmation

#### Root Cause
- No security-focused file handling library
- Direct filesystem operations without validation
- Insufficient input sanitization

#### Remediation Steps

**IMMEDIATE**:
1. Use secure temp file creation:
```javascript
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

async function createSecureTempFile(prefix = 'jarvis') {
  const tmpDir = '/tmp';
  const randomName = crypto.randomBytes(16).toString('hex');
  const filename = `${prefix}-${randomName}.wav`;
  const filepath = path.join(tmpDir, filename);
  
  // Create with restrictive permissions (0600)
  const fd = await fs.open(filepath, 'wx', 0o600);
  await fd.close();
  
  return filepath;
}
```

2. Implement path traversal protection:
```javascript
const path = require('path');

function sanitizeFilename(filename) {
  // Remove path separators and parent directory references
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '');
}

function saveConversationSecure(history, filename) {
  const baseDir = path.join(os.homedir(), '.jarvis');
  const safeName = sanitizeFilename(filename || 'conversation.json');
  const fullPath = path.join(baseDir, safeName);
  
  // Verify path is within allowed directory
  const resolvedPath = path.resolve(fullPath);
  const resolvedBase = path.resolve(baseDir);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Invalid file path: directory traversal detected');
  }
  
  // Create directory with secure permissions
  fs.mkdirSync(baseDir, { recursive: true, mode: 0o700 });
  
  // Write with atomic operation
  const tempPath = `${fullPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(history, null, 2), { mode: 0o600 });
  fs.renameSync(tempPath, fullPath);
  
  console.log(`💾 Conversation saved to ${fullPath}`);
}
```

3. Implement cleanup handler:
```javascript
const tempFiles = new Set();

function registerTempFile(filepath) {
  tempFiles.add(filepath);
}

function cleanupTempFiles() {
  for (const file of tempFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (err) {
      console.error(`Failed to cleanup ${file}:`, err);
    }
  }
  tempFiles.clear();
}

// Register cleanup handlers
process.on('exit', cleanupTempFiles);
process.on('SIGINT', () => {
  cleanupTempFiles();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupTempFiles();
  process.exit(0);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  cleanupTempFiles();
  process.exit(1);
});
```

---

## 2. Architectural Issues

### 2.1 CRITICAL: Massive Code Duplication

**Severity**: CRITICAL (for maintainability)  
**Impact**: HIGH  
**Files Affected**: `jarvis.js`, `enhanced-jarvis.js`, `consolidated-jarvis.js`

#### Issue Description
Three "main" files contain 80%+ identical code (~400 lines each):

**Duplication Analysis**:
```
jarvis.js:           450 lines
enhanced-jarvis.js:  380 lines  
consolidated-jarvis.js: 520 lines

Shared logic:
- Audio recording loop: ~100 lines (duplicated 3x)
- Command parsing: ~80 lines (duplicated 3x)
- Error handling: ~60 lines (duplicated 3x)
- Session management: ~50 lines (duplicated 3x)

Total duplicated code: ~900 lines
```

#### Root Cause
- Iterative development without refactoring
- Copy-paste programming
- No code review process
- Lack of architectural planning

#### Impact
- **Bug multiplication**: Fixes must be applied 3x
- **Inconsistent behavior**: Each file has subtle differences
- **Maintenance nightmare**: Changes require updating multiple files
- **Testing complexity**: Must test 3 implementations
- **Onboarding difficulty**: New developers confused by multiple entry points

#### Remediation Steps

**PHASE 1: Create Unified Core (Week 1)**

1. Design single-responsibility modules:
```
src/
├── core/
│   ├── audio/
│   │   ├── recorder.js       # Audio recording
│   │   ├── transcriber.js    # Groq Whisper integration
│   │   └── speaker.js        # TTS functionality
│   ├── ai/
│   │   ├── client.js         # Groq API client
│   │   └── conversation.js   # History management
│   ├── commands/
│   │   ├── parser.js         # Command detection
│   │   └── handlers.js       # Command execution
│   └── utils/
│       ├── config.js         # Configuration management
│       ├── errors.js         # Error handling
│       └── cleanup.js        # Resource cleanup
├── modes/
│   ├── standard.js           # Standard mode
│   ├── enhanced.js           # Enhanced features
│   └── seamless.js           # Seamless mode
└── index.js                  # Main entry point
```

2. Implement AudioRecorder class:
```javascript
// src/core/audio/recorder.js
const { spawn } = require('child_process');
const EventEmitter = require('events');

class AudioRecorder extends EventEmitter {
  constructor(options = {}) {
    super();
    this.silenceDuration = options.silenceDuration || 2;
    this.silenceThreshold = options.silenceThreshold || '5%';
    this.process = null;
  }

  async record(outputFile) {
    return new Promise((resolve, reject) => {
      this.emit('recording-started');
      
      this.process = spawn('sox', [
        '-d', '-t', 'wav', outputFile,
        'silence', '1', '0.1', '1%',
        'silence', '1', this.silenceDuration.toString(), this.silenceThreshold
      ]);

      this.process.on('close', (code) => {
        this.emit('recording-stopped');
        if (code === 0) resolve(outputFile);
        else reject(new Error(`Recording failed with code ${code}`));
      });

      this.process.on('error', (err) => {
        this.emit('recording-error', err);
        reject(err);
      });
    });
  }

  stop() {
    if (this.process) {
      this.process.kill('SIGINT');
    }
  }
}

module.exports = AudioRecorder;
```

3. Implement Transcriber class:
```javascript
// src/core/audio/transcriber.js
const FormData = require('form-data');
const https = require('https');
const fs = require('fs');

class Transcriber {
  constructor(apiKey, model = 'whisper-large-v3') {
    if (!apiKey) throw new Error('API key required');
    this.apiKey = apiKey;
    this.model = model;
  }

  async transcribe(audioFile) {
    if (!fs.existsSync(audioFile)) {
      throw new Error(`Audio file not found: ${audioFile}`);
    }

    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('file', fs.createReadStream(audioFile));
      form.append('model', this.model);
      form.append('response_format', 'text');
      form.append('language', 'en');

      const req = https.request({
        hostname: 'api.groq.com',
        port: 443,
        path: '/openai/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Transcription failed: ${data}`));
          } else {
            resolve(data.trim());
          }
        });
      });

      req.on('error', reject);
      form.pipe(req);
    });
  }
}

module.exports = Transcriber;
```

4. Implement ConversationManager:
```javascript
// src/core/ai/conversation.js
class ConversationManager {
  constructor(maxHistory = 20) {
    this.history = [];
    this.maxHistory = maxHistory;
  }

  addMessage(role, content) {
    this.history.push({ role, content });
    this.trim();
  }

  trim() {
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getHistory() {
    return [...this.history];
  }

  clear() {
    this.history = [];
  }

  save(filepath) {
    const fs = require('fs');
    fs.writeFileSync(filepath, JSON.stringify(this.history, null, 2));
  }

  load(filepath) {
    const fs = require('fs');
    if (fs.existsSync(filepath)) {
      this.history = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
  }
}

module.exports = ConversationManager;
```

5. Implement CommandParser:
```javascript
// src/core/commands/parser.js
class CommandParser {
  constructor() {
    this.commands = new Map();
    this.registerDefaultCommands();
  }

  registerDefaultCommands() {
    this.register('end conversation', 'exit');
    this.register('clear history', 'clear');
    this.register('save conversation', 'save');
    this.register('load conversation', 'load');
    this.register('show stats', 'stats');
    this.register('pause jarvis', 'pause');
    this.register('resume jarvis', 'resume');
    this.register('help', 'help');
  }

  register(trigger, commandName) {
    this.commands.set(trigger.toLowerCase(), commandName);
  }

  parse(text) {
    const lowerText = text.toLowerCase();
    
    for (const [trigger, command] of this.commands) {
      if (lowerText.includes(trigger)) {
        return { command, originalText: text };
      }
    }
    
    return { command: null, originalText: text };
  }
}

module.exports = CommandParser;
```

**PHASE 2: Migrate Existing Code (Week 2)**

6. Create unified entry point:
```javascript
// src/index.js
const AudioRecorder = require('./core/audio/recorder');
const Transcriber = require('./core/audio/transcriber');
const Speaker = require('./core/audio/speaker');
const AIClient = require('./core/ai/client');
const ConversationManager = require('./core/ai/conversation');
const CommandParser = require('./core/commands/parser');
const Config = require('./core/utils/config');

class JarvisAssistant {
  constructor(config) {
    this.config = config;
    this.recorder = new AudioRecorder(config.audio);
    this.transcriber = new Transcriber(config.groqApiKey, config.whisperModel);
    this.speaker = new Speaker(config.tts);
    this.ai = new AIClient(config.groqApiKey, config.groqModel);
    this.conversation = new ConversationManager(config.maxHistory);
    this.commandParser = new CommandParser();
    this.running = false;
  }

  async start() {
    console.log('🚀 JARVIS starting...');
    this.running = true;

    while (this.running) {
      try {
        await this.processInteraction();
      } catch (err) {
        console.error('Error:', err.message);
        await this.speaker.speak('An error occurred. Please try again.');
      }
    }
  }

  async processInteraction() {
    const audioFile = await this.recorder.record();
    const transcription = await this.transcriber.transcribe(audioFile);
    
    const { command, originalText } = this.commandParser.parse(transcription);
    
    if (command) {
      await this.handleCommand(command);
    } else {
      await this.handleQuery(originalText);
    }
  }

  async handleCommand(command) {
    // Command handling logic
  }

  async handleQuery(text) {
    const response = await this.ai.chat(text, this.conversation.getHistory());
    this.conversation.addMessage('user', text);
    this.conversation.addMessage('assistant', response);
    await this.speaker.speak(response);
  }

  stop() {
    this.running = false;
  }
}

module.exports = JarvisAssistant;
```

7. Delete redundant files:
```bash
# After migration is complete and tested
git rm enhanced-jarvis.js
git rm consolidated-jarvis.js
# Keep jarvis.js as legacy wrapper if needed
```

