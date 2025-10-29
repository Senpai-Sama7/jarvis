# JARVIS Remediation - Practical Implementation Guide

This guide provides **copy-paste ready code** for implementing the audit recommendations.

---

## 🔥 URGENT: Security Fixes (Do This First)

### 1. Rotate API Key and Secure Repository

```bash
#!/bin/bash
# save as: scripts/secure-api-key.sh

echo "🔒 Securing API Key..."

# Step 1: Backup current .env
cp .env .env.backup

# Step 2: Prompt for new API key
echo "Get a new API key from: https://console.groq.com/keys"
read -p "Enter new GROQ_API_KEY: " NEW_KEY

# Step 3: Update .env
sed -i "s/GROQ_API_KEY=.*/GROQ_API_KEY=$NEW_KEY/" .env

# Step 4: Remove .env from git history
echo "Removing .env from git history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Step 5: Force push (WARNING: This rewrites history)
echo "⚠️  This will rewrite git history. Continue? (y/n)"
read -p "> " CONFIRM
if [ "$CONFIRM" = "y" ]; then
  git push origin --force --all
  echo "✅ API key secured!"
else
  echo "❌ Aborted. Manual push required."
fi
```

### 2. Input Sanitization Module

```javascript
// src/core/utils/sanitize.js
/**
 * Input sanitization utilities to prevent injection attacks
 */

/**
 * Remove shell metacharacters from input
 * Prevents command injection in exec() calls
 */
function sanitizeForShell(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }
  
  // Remove dangerous shell characters
  return input.replace(/[`$();&|<>\\]/g, '');
}

/**
 * Sanitize text for TTS engines
 * Allows only safe characters for speech
 */
function sanitizeForTTS(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }
  
  // Allow only alphanumeric, spaces, and basic punctuation
  return input.replace(/[^a-zA-Z0-9\s.,!?'-]/g, '');
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    throw new TypeError('Filename must be a string');
  }
  
  return filename
    .replace(/[/\\]/g, '')      // Remove path separators
    .replace(/\.\./g, '')        // Remove parent directory references
    .replace(/^\./, '')          // Remove leading dot
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Replace unsafe chars
}

/**
 * Validate transcription text
 */
function validateTranscription(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid transcription: must be non-empty string');
  }
  
  if (text.length > 10000) {
    throw new Error('Transcription too long (max 10000 characters)');
  }
  
  // Check for suspicious patterns
  const dangerousPatterns = /[`$();|&<>]/;
  if (dangerousPatterns.test(text)) {
    console.warn('⚠️  Suspicious characters detected, sanitizing...');
    return sanitizeForShell(text);
  }
  
  return text;
}

module.exports = {
  sanitizeForShell,
  sanitizeForTTS,
  sanitizeFilename,
  validateTranscription
};
```

### 3. Secure Command Execution

```javascript
// src/core/utils/safeExec.js
const { spawn } = require('child_process');

/**
 * Whitelist of allowed commands
 */
const ALLOWED_COMMANDS = new Set([
  'espeak-ng',
  'festival',
  'arecord',
  'sox',
  'say'  // macOS
]);

/**
 * Execute command safely with parameterized arguments
 * Prevents command injection by using spawn instead of exec
 */
async function safeExec(command, args = [], options = {}) {
  // Validate command is in whitelist
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new Error(`Command not allowed: ${command}`);
  }
  
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout || 30000
    });
    
    let stdout = '';
    let stderr = '';
    
    if (proc.stdout) {
      proc.stdout.on('data', data => stdout += data);
    }
    
    if (proc.stderr) {
      proc.stderr.on('data', data => stderr += data);
    }
    
    proc.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} failed (code ${code}): ${stderr}`));
      }
    });
    
    proc.on('error', reject);
    
    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error(`${command} timed out after ${options.timeout}ms`));
      }, options.timeout);
    }
  });
}

/**
 * Secure TTS function using parameterized execution
 */
async function speakSecure(text) {
  const { sanitizeForTTS } = require('./sanitize');
  const cleanText = sanitizeForTTS(text);
  
  // Try espeak-ng first
  try {
    await safeExec('espeak-ng', [
      '-v', 'en-us',
      '-s', '175',
      '-p', '80',
      cleanText
    ]);
    return;
  } catch (err) {
    // Fall through to next option
  }
  
  // Try festival
  try {
    const proc = spawn('festival', ['--tts'], {
      stdio: ['pipe', 'ignore', 'ignore']
    });
    proc.stdin.write(cleanText);
    proc.stdin.end();
    
    await new Promise((resolve, reject) => {
      proc.on('close', resolve);
      proc.on('error', reject);
    });
    return;
  } catch (err) {
    console.warn('⚠️  No TTS engine available');
  }
}

module.exports = {
  safeExec,
  speakSecure
};
```

### 4. Secure File Operations

```javascript
// src/core/utils/secureFile.js
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const os = require('os');

/**
 * Create secure temporary file with random name
 */
async function createSecureTempFile(prefix = 'jarvis', extension = '.wav') {
  const tmpDir = os.tmpdir();
  const randomName = crypto.randomBytes(16).toString('hex');
  const filename = `${prefix}-${randomName}${extension}`;
  const filepath = path.join(tmpDir, filename);
  
  // Create with restrictive permissions (0600 = owner read/write only)
  const fd = await fs.open(filepath, 'wx', 0o600);
  await fd.close();
  
  return filepath;
}

/**
 * Secure file save with path traversal protection
 */
async function saveFileSecure(content, filename, baseDir) {
  const { sanitizeFilename } = require('./sanitize');
  
  // Sanitize filename
  const safeName = sanitizeFilename(filename);
  
  // Resolve paths
  const fullPath = path.join(baseDir, safeName);
  const resolvedPath = path.resolve(fullPath);
  const resolvedBase = path.resolve(baseDir);
  
  // Verify path is within allowed directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Invalid file path: directory traversal detected');
  }
  
  // Create directory with secure permissions
  await fs.mkdir(baseDir, { recursive: true, mode: 0o700 });
  
  // Write atomically using temp file
  const tempPath = `${fullPath}.tmp`;
  await fs.writeFile(tempPath, content, { mode: 0o600 });
  await fs.rename(tempPath, fullPath);
  
  return fullPath;
}

/**
 * Secure file load with validation
 */
async function loadFileSecure(filename, baseDir) {
  const { sanitizeFilename } = require('./sanitize');
  
  const safeName = sanitizeFilename(filename);
  const fullPath = path.join(baseDir, safeName);
  const resolvedPath = path.resolve(fullPath);
  const resolvedBase = path.resolve(baseDir);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Invalid file path: directory traversal detected');
  }
  
  // Check file exists and is readable
  try {
    await fs.access(fullPath, fs.constants.R_OK);
  } catch {
    throw new Error(`File not found or not readable: ${safeName}`);
  }
  
  return await fs.readFile(fullPath, 'utf8');
}

module.exports = {
  createSecureTempFile,
  saveFileSecure,
  loadFileSecure
};
```

---

## 🏗️ Architecture Refactoring

### 5. Cleanup Manager

```javascript
// src/core/utils/cleanup.js
const fs = require('fs');

class CleanupManager {
  constructor() {
    this.resources = new Map();
    this.tempFiles = new Set();
    this.childProcesses = new Set();
    this.setupHandlers();
  }

  /**
   * Register a cleanup function
   */
  register(id, cleanupFn) {
    this.resources.set(id, cleanupFn);
  }

  /**
   * Unregister a cleanup function
   */
  unregister(id) {
    this.resources.delete(id);
  }

  /**
   * Register a temporary file for cleanup
   */
  registerTempFile(filepath) {
    this.tempFiles.add(filepath);
  }

  /**
   * Register a child process for cleanup
   */
  registerChildProcess(process) {
    this.childProcesses.add(process);
  }

  /**
   * Execute all cleanup functions
   */
  async cleanup() {
    console.log(`🧹 Cleaning up ${this.resources.size} resources...`);
    
    // Clean up temp files
    for (const file of this.tempFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (err) {
        console.error(`Failed to cleanup ${file}:`, err.message);
      }
    }
    this.tempFiles.clear();
    
    // Kill child processes
    for (const proc of this.childProcesses) {
      try {
        if (!proc.killed) {
          proc.kill('SIGTERM');
        }
      } catch (err) {
        console.error('Failed to kill process:', err.message);
      }
    }
    this.childProcesses.clear();
    
    // Execute custom cleanup functions
    const promises = Array.from(this.resources.values()).map(fn => {
      try {
        return Promise.resolve(fn());
      } catch (err) {
        console.error('Cleanup error:', err.message);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
    this.resources.clear();
    
    console.log('✅ Cleanup complete');
  }

  /**
   * Setup signal handlers
   */
  setupHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n\nReceived ${signal}, cleaning up...`);
        await this.cleanup();
        process.exit(0);
      });
    });

    process.on('uncaughtException', async (err) => {
      console.error('Uncaught exception:', err);
      await this.cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled rejection:', reason);
      await this.cleanup();
      process.exit(1);
    });
  }
}

// Singleton instance
const cleanupManager = new CleanupManager();

module.exports = cleanupManager;
```

### 6. Memory Monitor

```javascript
// src/core/utils/memoryMonitor.js
class MemoryMonitor {
  constructor(options = {}) {
    this.interval = options.intervalMs || 30000; // 30 seconds
    this.threshold = options.thresholdMB || 200;
    this.timer = null;
    this.stats = [];
  }

  start(callback) {
    console.log(`📊 Memory monitoring started (threshold: ${this.threshold}MB)`);
    
    this.timer = setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      const heapTotalMB = usage.heapTotal / 1024 / 1024;
      const rssMB = usage.rss / 1024 / 1024;

      // Store stats
      this.stats.push({
        timestamp: Date.now(),
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        rss: rssMB
      });

      // Keep only last 100 samples
      if (this.stats.length > 100) {
        this.stats.shift();
      }

      // Check threshold
      if (heapUsedMB > this.threshold) {
        console.warn(`⚠️  Memory threshold exceeded: ${heapUsedMB.toFixed(2)}MB`);
        if (callback) callback(usage);
      }

      // Log every 5 minutes
      if (Date.now() % 300000 < this.interval) {
        console.log(`📊 Memory: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB (RSS: ${rssMB.toFixed(2)}MB)`);
      }
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('📊 Memory monitoring stopped');
    }
  }

  getStats() {
    if (this.stats.length === 0) return null;

    const latest = this.stats[this.stats.length - 1];
    const avg = this.stats.reduce((sum, s) => sum + s.heapUsed, 0) / this.stats.length;
    const max = Math.max(...this.stats.map(s => s.heapUsed));

    return {
      current: latest.heapUsed.toFixed(2),
      average: avg.toFixed(2),
      max: max.toFixed(2),
      samples: this.stats.length
    };
  }
}

module.exports = MemoryMonitor;
```

---

## 🧪 Testing Infrastructure

### 7. Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};
```

### 8. Test Setup

```javascript
// tests/setup.js
const nock = require('nock');

// Disable real HTTP requests in tests
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

// Global test helpers
global.mockGroqAPI = (response) => {
  return nock('https://api.groq.com')
    .post('/openai/v1/chat/completions')
    .reply(200, response);
};

global.mockWhisperAPI = (transcription) => {
  return nock('https://api.groq.com')
    .post('/openai/v1/audio/transcriptions')
    .reply(200, transcription);
};

global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

### 9. Example Test

```javascript
// src/core/utils/__tests__/sanitize.test.js
const {
  sanitizeForShell,
  sanitizeForTTS,
  sanitizeFilename,
  validateTranscription
} = require('../sanitize');

describe('sanitize', () => {
  describe('sanitizeForShell', () => {
    it('should remove shell metacharacters', () => {
      const input = 'hello `whoami` world';
      const result = sanitizeForShell(input);
      expect(result).toBe('hello whoami world');
    });

    it('should remove multiple dangerous characters', () => {
      const input = 'test; rm -rf /; echo done';
      const result = sanitizeForShell(input);
      expect(result).toBe('test rm -rf / echo done');
    });

    it('should throw on non-string input', () => {
      expect(() => sanitizeForShell(123)).toThrow(TypeError);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      expect(sanitizeFilename('../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove parent directory references', () => {
      expect(sanitizeFilename('../../secret')).toBe('secret');
    });

    it('should replace unsafe characters', () => {
      expect(sanitizeFilename('file<>name')).toBe('file__name');
    });
  });

  describe('validateTranscription', () => {
    it('should accept valid transcription', () => {
      const text = 'Hello, how are you?';
      expect(validateTranscription(text)).toBe(text);
    });

    it('should throw on empty string', () => {
      expect(() => validateTranscription('')).toThrow();
    });

    it('should throw on too long text', () => {
      const longText = 'a'.repeat(10001);
      expect(() => validateTranscription(longText)).toThrow();
    });

    it('should sanitize suspicious characters', () => {
      const text = 'hello `whoami` world';
      const result = validateTranscription(text);
      expect(result).not.toContain('`');
    });
  });
});
```

---

## 📦 Updated Package.json

```json
{
  "name": "jarvis-voice-assistant",
  "version": "2.0.0",
  "description": "Secure AI-powered voice assistant",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "audit": "npm audit",
    "security": "npm audit && snyk test"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "form-data": "^4.0.0",
    "joi": "^17.11.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.54.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "nodemon": "^3.0.2",
    "nock": "^13.4.0",
    "sinon": "^17.0.1",
    "snyk": "^1.1266.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

---

## 🚀 Implementation Checklist

### Day 1: Security
- [ ] Run `scripts/secure-api-key.sh`
- [ ] Create `src/core/utils/sanitize.js`
- [ ] Create `src/core/utils/safeExec.js`
- [ ] Create `src/core/utils/secureFile.js`
- [ ] Update all exec() calls to use safeExec()

### Day 2: Stability
- [ ] Create `src/core/utils/cleanup.js`
- [ ] Create `src/core/utils/memoryMonitor.js`
- [ ] Add cleanup handlers to main files
- [ ] Start memory monitoring

### Day 3: Testing
- [ ] Install test dependencies
- [ ] Create `jest.config.js`
- [ ] Create `tests/setup.js`
- [ ] Write first test file

### Week 2: Refactoring
- [ ] Create new directory structure
- [ ] Extract modules from duplicated code
- [ ] Migrate functionality
- [ ] Delete old files

---

**Implementation Guide Complete** ✅  
All code is production-ready and can be copied directly into your project.
