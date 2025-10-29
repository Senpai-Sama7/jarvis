# JARVIS Code Audit - Part 3: Quality, Performance & Testing

## 3. Code Quality Analysis

### 3.1 HIGH: Inconsistent Error Handling

**Severity**: HIGH  
**Impact**: Application crashes, poor user experience  
**Files Affected**: All JavaScript files

#### Issue Description

**Inconsistent Patterns**:
```javascript
// jarvis.js - Has timeout protection
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Response timeout')), 30000)
);
const response = await Promise.race([responsePromise, timeoutPromise]);

// enhanced-jarvis.js - NO timeout protection
const response = await getChatResponse(transcription, conversationHistory);
// Can hang indefinitely if API doesn't respond
```

**Missing Error Boundaries**:
```javascript
// voice-core.js:150 - No validation of API response structure
resolve(response.choices[0].message.content);
// Will throw if response.choices is undefined
```

**Inconsistent Error Messages**:
```javascript
// Some files: "❌ Error:"
// Other files: "Error:"
// Some files: Detailed error context
// Other files: Generic messages
```

#### Root Cause
- No centralized error handling strategy
- Each file implements its own error logic
- No error classification system
- Missing error recovery mechanisms

#### Remediation Steps

**IMMEDIATE**:
1. Create centralized error handling:
```javascript
// src/core/utils/errors.js
class JarvisError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class APIError extends JarvisError {
  constructor(message, statusCode, details) {
    super(message, 'API_ERROR', { statusCode, ...details });
  }
}

class AudioError extends JarvisError {
  constructor(message, details) {
    super(message, 'AUDIO_ERROR', details);
  }
}

class ConfigError extends JarvisError {
  constructor(message, details) {
    super(message, 'CONFIG_ERROR', details);
  }
}

class TimeoutError extends JarvisError {
  constructor(operation, timeout) {
    super(`Operation timed out: ${operation}`, 'TIMEOUT_ERROR', { timeout });
  }
}

module.exports = {
  JarvisError,
  APIError,
  AudioError,
  ConfigError,
  TimeoutError
};
```

2. Implement error handler middleware:
```javascript
// src/core/utils/errorHandler.js
const { JarvisError, APIError, AudioError, TimeoutError } = require('./errors');

class ErrorHandler {
  constructor(speaker) {
    this.speaker = speaker;
    this.errorLog = [];
  }

  async handle(error, context = {}) {
    // Log error
    this.logError(error, context);

    // Determine user-friendly message
    const userMessage = this.getUserMessage(error);

    // Speak error to user
    if (this.speaker) {
      await this.speaker.speak(userMessage);
    }

    // Determine if recoverable
    return this.isRecoverable(error);
  }

  logError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context
    };

    this.errorLog.push(logEntry);
    console.error('❌ Error:', error.message);
    
    if (error.details) {
      console.error('   Details:', error.details);
    }
  }

  getUserMessage(error) {
    if (error instanceof APIError) {
      if (error.details.statusCode === 401) {
        return 'API authentication failed. Please check your API key.';
      }
      if (error.details.statusCode === 429) {
        return 'Rate limit exceeded. Please wait a moment and try again.';
      }
      return 'API error occurred. Please try again.';
    }

    if (error instanceof AudioError) {
      return 'Audio system error. Please check your microphone.';
    }

    if (error instanceof TimeoutError) {
      return 'Request timed out. The service may be busy, please try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  isRecoverable(error) {
    // Non-recoverable errors
    if (error instanceof ConfigError) return false;
    if (error.code === 'ENOENT') return false;
    
    // Recoverable errors
    return true;
  }

  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recent: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(entry => {
      const type = entry.error.name;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }
}

module.exports = ErrorHandler;
```

3. Add timeout wrapper utility:
```javascript
// src/core/utils/timeout.js
async function withTimeout(promise, timeoutMs, operation = 'Operation') {
  const { TimeoutError } = require('./errors');
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

module.exports = { withTimeout };
```

4. Implement retry logic:
```javascript
// src/core/utils/retry.js
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 2,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoff, attempt - 1);
        
        if (onRetry) {
          onRetry(attempt, maxAttempts, delay, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

module.exports = { retry };
```

5. Update API calls with error handling:
```javascript
// src/core/ai/client.js
const { APIError } = require('../utils/errors');
const { withTimeout } = require('../utils/timeout');
const { retry } = require('../utils/retry');

class AIClient {
  async chat(message, history) {
    return retry(
      () => withTimeout(
        this._makeRequest(message, history),
        30000,
        'AI chat request'
      ),
      {
        maxAttempts: 3,
        delayMs: 2000,
        onRetry: (attempt, max, delay) => {
          console.log(`Retry ${attempt}/${max} in ${delay}ms...`);
        }
      }
    );
  }

  async _makeRequest(message, history) {
    // ... existing request logic ...
    
    // Validate response structure
    if (!response || !response.choices || !response.choices[0]) {
      throw new APIError(
        'Invalid API response structure',
        response.status || 500,
        { response }
      );
    }

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new APIError(
        'Empty response from API',
        200,
        { response }
      );
    }

    return content;
  }
}
```

---

## 4. Performance & Resource Management

### 4.1 HIGH: Memory Leaks

**Severity**: HIGH  
**Impact**: Application crashes after extended use  
**Files Affected**: All files with conversation history

#### Issue Description

**Unbounded Array Growth**:
```javascript
// enhanced-jarvis.js - NO history trimming
conversationHistory.push(
  { role: 'user', content: transcription },
  { role: 'assistant', content: response }
);
// Grows indefinitely, causing memory exhaustion
```

**Missing Resource Cleanup**:
```javascript
// voice-core.js - File descriptors may leak
const form = new FormData();
form.append('file', fs.createReadStream(audioFile));
// Stream not explicitly closed on error
```

#### Root Cause
- No memory management strategy
- Missing cleanup handlers
- No resource pooling
- Lack of monitoring

#### Remediation Steps

**IMMEDIATE**:
1. Implement memory-safe conversation manager:
```javascript
// src/core/ai/conversation.js (enhanced)
class ConversationManager {
  constructor(options = {}) {
    this.history = [];
    this.maxHistory = options.maxHistory || 20;
    this.maxMemoryMB = options.maxMemoryMB || 100;
    this.compressionEnabled = options.compression || false;
  }

  addMessage(role, content) {
    this.history.push({ 
      role, 
      content,
      timestamp: Date.now()
    });
    
    this.trim();
    this.checkMemory();
  }

  trim() {
    if (this.history.length > this.maxHistory) {
      const removed = this.history.length - this.maxHistory;
      this.history = this.history.slice(-this.maxHistory);
      console.log(`✂️  Trimmed ${removed} old messages`);
    }
  }

  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > this.maxMemoryMB) {
      console.warn(`⚠️  High memory usage: ${heapUsedMB.toFixed(2)}MB`);
      this.aggressiveTrim();
    }
  }

  aggressiveTrim() {
    // Keep only most recent 10 messages
    const keepCount = Math.min(10, this.maxHistory);
    this.history = this.history.slice(-keepCount);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  getMemoryStats() {
    const historySize = JSON.stringify(this.history).length;
    const memoryUsage = process.memoryUsage();
    
    return {
      historyCount: this.history.length,
      historySizeKB: (historySize / 1024).toFixed(2),
      heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2)
    };
  }
}
```

2. Implement resource cleanup manager:
```javascript
// src/core/utils/cleanup.js
class CleanupManager {
  constructor() {
    this.resources = new Map();
    this.setupHandlers();
  }

  register(id, cleanupFn) {
    this.resources.set(id, cleanupFn);
  }

  unregister(id) {
    this.resources.delete(id);
  }

  async cleanup() {
    console.log(`🧹 Cleaning up ${this.resources.size} resources...`);
    
    const promises = Array.from(this.resources.values()).map(fn => {
      try {
        return Promise.resolve(fn());
      } catch (err) {
        console.error('Cleanup error:', err);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
    this.resources.clear();
  }

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

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection:', reason);
      await this.cleanup();
      process.exit(1);
    });
  }
}

module.exports = CleanupManager;
```

3. Add memory monitoring:
```javascript
// src/core/utils/monitor.js
class MemoryMonitor {
  constructor(options = {}) {
    this.interval = options.intervalMs || 30000; // 30 seconds
    this.threshold = options.thresholdMB || 200;
    this.timer = null;
  }

  start(callback) {
    this.timer = setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      const heapTotalMB = usage.heapTotal / 1024 / 1024;

      if (heapUsedMB > this.threshold) {
        console.warn(`⚠️  Memory threshold exceeded: ${heapUsedMB.toFixed(2)}MB`);
        if (callback) callback(usage);
      }

      // Log every 5 minutes
      if (Date.now() % 300000 < this.interval) {
        console.log(`📊 Memory: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB`);
      }
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = MemoryMonitor;
```

---

## 5. Testing & Quality Assurance

### 5.1 CRITICAL: Zero Test Coverage

**Severity**: CRITICAL  
**Impact**: No confidence in code changes, high bug risk  
**Files Affected**: Entire codebase

#### Issue Description
- **0% test coverage** across all modules
- No unit tests
- No integration tests
- No end-to-end tests
- No test infrastructure

#### Root Cause
- Rapid prototyping without TDD
- No testing culture
- No CI/CD pipeline
- Missing test dependencies

#### Remediation Steps

**PHASE 1: Setup Test Infrastructure (Week 1)**

1. Install test dependencies:
```bash
npm install --save-dev \
  jest \
  @types/jest \
  supertest \
  nock \
  sinon \
  @testing-library/node
```

2. Create Jest configuration:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
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
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

3. Create test utilities:
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
```

**PHASE 2: Write Unit Tests (Week 2)**

4. Test ConversationManager:
```javascript
// src/core/ai/__tests__/conversation.test.js
const ConversationManager = require('../conversation');

describe('ConversationManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ConversationManager({ maxHistory: 5 });
  });

  describe('addMessage', () => {
    it('should add message to history', () => {
      manager.addMessage('user', 'Hello');
      expect(manager.getHistory()).toHaveLength(1);
      expect(manager.getHistory()[0]).toEqual({
        role: 'user',
        content: 'Hello',
        timestamp: expect.any(Number)
      });
    });

    it('should trim history when exceeding max', () => {
      for (let i = 0; i < 10; i++) {
        manager.addMessage('user', `Message ${i}`);
      }
      expect(manager.getHistory()).toHaveLength(5);
    });
  });

  describe('clear', () => {
    it('should remove all messages', () => {
      manager.addMessage('user', 'Hello');
      manager.clear();
      expect(manager.getHistory()).toHaveLength(0);
    });
  });

  describe('save and load', () => {
    it('should persist and restore history', () => {
      const fs = require('fs');
      const tmpFile = '/tmp/test-conversation.json';

      manager.addMessage('user', 'Test');
      manager.save(tmpFile);

      const newManager = new ConversationManager();
      newManager.load(tmpFile);

      expect(newManager.getHistory()).toEqual(manager.getHistory());

      fs.unlinkSync(tmpFile);
    });
  });
});
```

5. Test AIClient:
```javascript
// src/core/ai/__tests__/client.test.js
const AIClient = require('../client');
const nock = require('nock');

describe('AIClient', () => {
  let client;

  beforeEach(() => {
    client = new AIClient('test-api-key', 'test-model');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('chat', () => {
    it('should return AI response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello, how can I help?'
          }
        }]
      };

      nock('https://api.groq.com')
        .post('/openai/v1/chat/completions')
        .reply(200, mockResponse);

      const response = await client.chat('Hello', []);
      expect(response).toBe('Hello, how can I help?');
    });

    it('should throw APIError on failure', async () => {
      nock('https://api.groq.com')
        .post('/openai/v1/chat/completions')
        .reply(500, { error: { message: 'Server error' } });

      await expect(client.chat('Hello', []))
        .rejects
        .toThrow('Server error');
    });

    it('should retry on transient failures', async () => {
      nock('https://api.groq.com')
        .post('/openai/v1/chat/completions')
        .reply(503)
        .post('/openai/v1/chat/completions')
        .reply(200, {
          choices: [{ message: { content: 'Success' } }]
        });

      const response = await client.chat('Hello', []);
      expect(response).toBe('Success');
    });
  });
});
```

6. Add npm test scripts:
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

