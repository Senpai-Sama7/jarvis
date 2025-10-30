#!/usr/bin/env node

/**
 * Voice Core Module
 * Shared functionality for all voice interfaces
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const os = require('os');
const https = require('https');
const FormData = require('form-data');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-large-v3';
const SILENCE_DURATION = process.env.SILENCE_DURATION || '2';
const SILENCE_THRESHOLD = process.env.SILENCE_THRESHOLD || '5%';

// ============================================================================
// DEPENDENCY CHECKING
// ============================================================================

async function checkDependencies() {
  const deps = {
    required: ['arecord', 'curl'],
    optional: ['sox', 'festival', 'espeak-ng', 'xclip']
  };
  
  const results = { missing: [], optional: [] };
  
  for (const cmd of deps.required) {
    try {
      await execAsync(`which ${cmd}`);
    } catch {
      results.missing.push(cmd);
    }
  }
  
  for (const cmd of deps.optional) {
    try {
      await execAsync(`which ${cmd}`);
    } catch {
      results.optional.push(cmd);
    }
  }
  
  return results;
}

async function checkAndFixAudio() {
  console.log('🔍 Checking audio system...');
  
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in .env file');
    return false;
  }
  
  const deps = await checkDependencies();
  
  if (deps.missing.length > 0) {
    console.error(`❌ Missing required: ${deps.missing.join(', ')}`);
    console.log('Install: sudo apt install alsa-utils curl');
    return false;
  }
  
  try {
    const { stdout } = await execAsync('arecord -l');
    if (stdout.includes('card')) {
      console.log('✓ Microphone detected');
      return true;
    }
  } catch {
    console.error('❌ No microphone detected');
    return false;
  }
  
  return true;
}

// ============================================================================
// AUDIO RECORDING
// ============================================================================

async function recordAudio(outputFile, options = {}) {
  const useSilenceDetection = options.silenceDetection !== false;
  
  return new Promise((resolve, reject) => {
    console.log('🎤 Listening...');
    
    let recordingProcess;
    
    if (useSilenceDetection) {
      recordingProcess = spawn('sox', [
        '-d', '-t', 'wav', outputFile,
        'silence', '1', '0.1', '1%',
        'silence', '1', SILENCE_DURATION, SILENCE_THRESHOLD
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      
      recordingProcess.on('error', (err) => {
        if (err.code === 'ENOENT') {
          console.log('⚠️  sox not found, using manual mode');
          recordingProcess = spawn('arecord', ['-f', 'cd', '-t', 'wav', outputFile]);
          recordingProcess.on('close', () => resolve());
          recordingProcess.on('error', reject);
        } else {
          reject(err);
        }
      });
      
      recordingProcess.on('close', () => {
        console.log('✓ Silence detected');
        resolve();
      });
    } else {
      recordingProcess = spawn('arecord', ['-f', 'cd', '-t', 'wav', outputFile]);
      recordingProcess.on('close', () => resolve());
      recordingProcess.on('error', reject);
    }
  });
}

// ============================================================================
// TRANSCRIPTION
// ============================================================================

async function transcribe(audioFile) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile));
    form.append('model', WHISPER_MODEL);
    form.append('response_format', 'text');
    form.append('language', 'en');
    
    const req = https.request({
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          try {
            const errorResponse = JSON.parse(data);
            reject(new Error(`Transcription API Error (${res.statusCode}): ${errorResponse.error?.message || 'Unknown error'}`));
          } catch {
            reject(new Error(`Transcription API Error (${res.statusCode}): ${data || 'Unknown error'}`));
          }
        } else {
          resolve(data.trim());
        }
      });
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

// ============================================================================
// CHAT COMPLETION
// ============================================================================

async function getChatResponse(userMessage, conversationHistory = []) {
  return new Promise((resolve, reject) => {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI coding assistant. Provide concise, accurate responses. Keep responses under 100 words unless code is needed.'
      },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    
    const payload = JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024
    });
    
    const req = https.request({
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          // Check if the response contains an error
          if (response.error) {
            reject(new Error(`API Error: ${response.error.message || 'Unknown error'}`));
            return;
          }
          
          // Check if choices array exists and has content
          if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
            reject(new Error(`Invalid response format: ${JSON.stringify(response)}`));
            return;
          }
          
          resolve(response.choices[0].message.content);
        } catch (err) {
          reject(new Error(`Failed to parse API response: ${err.message}. Raw response: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ============================================================================
// TEXT-TO-SPEECH
// ============================================================================

async function speak(text, options = {}) {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/`[^`]+`/g, 'code')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .slice(0, 1000);
  
  console.log(`🤖 JARVIS: ${text}`);
  
  if (options.silent) return;
  
  const ttsEngine = options.engine || process.env.TTS_ENGINE || 'auto';
  
  const ttsOptions = [
    { name: 'festival', args: ['--tts'], useStdin: true },
    { name: 'espeak-ng', args: ['-v', 'en-us', '-s', '175', '-p', '80', cleanText], useStdin: false },
    { name: 'espeak', args: ['-v', 'en-us', '-s', '175', '-p', '80', cleanText], useStdin: false },
    { name: 'say', args: [cleanText], useStdin: false }
  ];
  
  if (ttsEngine !== 'auto') {
    const engine = ttsOptions.find(opt => opt.name === ttsEngine);
    if (engine) {
      try {
        await execAsync(`which ${engine.name}`);
        await speakWithEngine(engine.name, engine.args, engine.useStdin, cleanText);
        return;
      } catch (err) {
        console.error(`TTS engine ${ttsEngine} not available, falling back to alternatives`);
      }
    }
  }
  
  for (const engine of ttsOptions) {
    try {
      await execAsync(`which ${engine.name}`);
      await speakWithEngine(engine.name, engine.args, engine.useStdin, cleanText);
      return;
    } catch {}
  }
  
  console.warn('⚠️  No TTS engine available, text will only be displayed');
}

function speakWithEngine(command, args, useStdin, text) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      stdio: useStdin ? ['pipe', 'ignore', 'ignore'] : ['ignore', 'ignore', 'ignore'] 
    });
    
    if (useStdin) {
      proc.stdin.write(text);
      proc.stdin.end();
    }
    
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`TTS exited with code ${code}`));
    });
    
    proc.on('error', reject);
  });
}

// ============================================================================
// CONVERSATION PERSISTENCE
// ============================================================================

function saveConversation(history, filename) {
  const dir = `${os.homedir()}/.jarvis`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = `${dir}/${filename || 'jarvis-conversation.json'}`;

  // Create backup of previous conversation
  if (fs.existsSync(filePath)) {
    const backupFile = filePath.replace('.json', `-${Date.now()}.backup.json`);
    fs.copyFileSync(filePath, backupFile);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  console.log(`💾 Conversation saved to ${filePath}`);
}

function loadConversation(filename) {
  const filePath = `${os.homedir()}/.jarvis/${filename || 'jarvis-conversation.json'}`;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const history = JSON.parse(data);
    console.log(`📂 Loaded ${history.length / 2} messages from ${filePath}`);
    return history;
  } catch (err) {
    console.log(`⚠️  No existing conversation found at ${filePath}, starting fresh`);
    return [];
  }
}

// ============================================================================
// PERFORMANCE AND UTILITY FUNCTIONS
// ============================================================================

// Performance metrics
function getPerformanceStats(startTimestamp) {
  return {
    startTime: startTimestamp,
    uptime: Date.now() - startTimestamp,
    timestamp: new Date().toISOString()
  };
}

// Configuration validation
function validateConfig() {
  const config = {
    groqApiKey: GROQ_API_KEY,
    groqModel: GROQ_MODEL,
    whisperModel: WHISPER_MODEL,
    silenceDuration: SILENCE_DURATION,
    silenceThreshold: SILENCE_THRESHOLD
  };
  
  const errors = [];
  if (!config.groqApiKey || config.groqApiKey === 'your_api_key_here') {
    errors.push('Missing or invalid GROQ_API_KEY in .env');
  }
  
  return {
    config,
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkDependencies,
  checkAndFixAudio,
  recordAudio,
  transcribe,
  getChatResponse,
  speak,
  saveConversation,
  loadConversation,
  getPerformanceStats,
  validateConfig
};
