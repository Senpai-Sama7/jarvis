#!/usr/bin/env node

/**
 * JARVIS - Fully Automated Voice Assistant
 * A consolidated, secure, and efficient voice assistant system
 */

const fs = require('fs');
const os = require('os');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration from environment variables
require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-large-v3';
const SILENCE_DURATION = process.env.SILENCE_DURATION || '2';
const SILENCE_THRESHOLD = process.env.SILENCE_THRESHOLD || '5%';

// ============================================================================
// CORE UTILITY FUNCTIONS
// ============================================================================

// Check system dependencies
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

// Check and fix audio system
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

// Record audio with silence detection
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

// Transcribe audio using Groq Whisper API
async function transcribe(audioFile) {
  const FormData = require('form-data');
  const https = require('https');
  
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

// Get chat response from Groq API
async function getChatResponse(userMessage, conversationHistory = []) {
  const https = require('https');
  
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

// Text-to-speech with multiple fallback options
async function speak(text, options = {}) {
  const cleanText = text
    .replace(/```[\\s\\S]*?```/g, 'code block')
    .replace(/`[^`]+`/g, 'code')
    .replace(/\\*\\*/g, '')
    .replace(/\\*/g, '')
    .slice(0, 1000);  // Increased limit for better responses
  
  console.log(`🤖 JARVIS: ${text}`);
  
  if (options.silent) return;
  
  // Check for TTS preference in environment or options
  const ttsEngine = options.engine || process.env.TTS_ENGINE || 'auto';
  
  // Try different TTS engines in order of preference
  const ttsOptions = [
    { name: 'festival', cmd: `echo "${cleanText.replace(/"/g, '\\"')}" | festival --tts` },
    { name: 'espeak-ng', cmd: `espeak-ng -v en-us -s 175 -p 80 "${cleanText.replace(/"/g, '\\"')}"` },
    { name: 'espeak', cmd: `espeak -v en-us -s 175 -p 80 "${cleanText.replace(/"/g, '\\"')}"` },
    { name: 'say', cmd: `say "${cleanText.replace(/"/g, '\\"')}"` }  // For macOS compatibility
  ];
  
  // If specific engine requested, try only that one
  if (ttsEngine !== 'auto') {
    const engine = ttsOptions.find(opt => opt.name === ttsEngine);
    if (engine) {
      try {
        await execAsync(`which ${engine.name}`);
        await execAsync(`${engine.cmd} 2>/dev/null`);
        return;
      } catch (err) {
        console.error(`TTS engine ${ttsEngine} not available, falling back to alternatives`);
      }
    }
  }
  
  // Otherwise try them in order
  for (const engine of ttsOptions) {
    try {
      await execAsync(`which ${engine.name}`);
      await execAsync(`${engine.cmd} 2>/dev/null`);
      return;
    } catch {}
  }
  
  console.warn('⚠️  No TTS engine available, text will only be displayed');
}

// Save conversation to user's home directory
function saveConversation(history, filename) {
  const dir = `${os.homedir()}/.jarvis`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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

// Load conversation from user's home directory
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
// MAIN APPLICATION LOGIC
// ============================================================================

let conversationHistory = [];
let isRecording = false;
let sessionStartTime = Date.now();
let conversationCount = 0;
let isPaused = false;
let autoSaveEnabled = true;
let sessionConfig = {
  maxHistoryLength: 20,  // Limit conversation history to prevent memory issues
  autoSaveInterval: 5,   // Auto-save every 5 conversations
  responseTimeout: 30000 // 30 second timeout for responses
};

// Display session statistics
function displayStats() {
  const stats = getPerformanceStats(sessionStartTime);
  const configValidation = validateConfig();
  
  console.log('');
  console.log('📊 Session Statistics:');
  console.log(`  • Uptime: ${(stats.uptime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  • Conversations: ${conversationCount}`);
  console.log(`  • History Length: ${conversationHistory.length} messages`);
  console.log(`  • Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  • Auto-save: ${autoSaveEnabled ? 'ON' : 'OFF'}`);
  console.log(`  • Status: ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
  console.log(`  • Timestamp: ${stats.timestamp}`);
  if (!configValidation.isValid) {
    console.log(`  • ⚠️  Config issues: ${configValidation.errors.length}`);
  }
  console.log('');
}

// Display help information
function displayHelp() {
  console.log('');
  console.log('📋 Available Commands:');
  console.log('  • "end conversation jarvis"      - Exit the assistant');
  console.log('  • "clear history"                - Reset conversation');
  console.log('  • "save conversation"            - Save to file');
  console.log('  • "load conversation"            - Load from file');
  console.log('  • "show stats"                   - Display session info');
  console.log('  • "pause jarvis"                 - Pause listening');
  console.log('  • "resume jarvis"                - Resume listening');
  console.log('  • "toggle auto-save"             - Turn auto-save on/off');
  console.log('  • "help"                         - Show this help');
  console.log('  • Press Ctrl+C twice             - Emergency exit');
  console.log('');
}

// Trim conversation history if needed
function trimHistoryIfNeeded() {
  // Keep only the most recent messages to prevent memory issues
  if (conversationHistory.length > sessionConfig.maxHistoryLength) {
    conversationHistory = conversationHistory.slice(-sessionConfig.maxHistoryLength);
    console.log(`✂️  History trimmed to ${sessionConfig.maxHistoryLength} most recent messages`);
  }
}

// Auto-save conversation if needed
function autoSaveIfNeeded() {
  if (autoSaveEnabled && conversationCount % sessionConfig.autoSaveInterval === 0) {
    saveConversation(conversationHistory);
    console.log(`💾 Auto-saved at conversation #${conversationCount}`);
  }
}

// Main function
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║         JARVIS - Voice Assistant Active           ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  
  console.log('🔧 Checking configuration...');
  const configValidation = validateConfig();
  
  if (!configValidation.isValid) {
    console.error('❌ Configuration issues found:');
    configValidation.errors.forEach(error => console.error(`  • ${error}`));
    console.log('');
    console.log('Please update your .env file with the required information.');
    process.exit(1);
  }
  
  console.log('✅ Configuration is valid');
  
  const audioOk = await checkAndFixAudio();
  if (!audioOk) {
    console.error('❌ Cannot proceed without working microphone');
    process.exit(1);
  }
  
  console.log('');
  console.log('✅ All systems operational');
  console.log('');
  console.log('━'.repeat(52));
  console.log('');
  console.log('Voice Commands:');
  console.log('  • "end conversation jarvis" - Exit');
  console.log('  • "clear history" - Reset conversation');
  console.log('  • "save conversation" - Save to file');
  console.log('  • "load conversation" - Load from file');
  console.log('  • "show stats" - Display session info');
  console.log('  • "pause jarvis" - Pause listening');
  console.log('  • "resume jarvis" - Resume listening');
  console.log('  • "toggle auto-save" - Turn auto-save on/off');
  console.log('  • "help" - Show available commands');
  console.log('  • Press Ctrl+C twice to force exit');
  console.log('');
  console.log('Starting in 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  console.log('');
  
  let conversationNum = 0;
  
  while (true) {
    if (isPaused) {
      console.log('⏸️  JARVIS is paused. Say "resume jarvis" to continue...');
      await new Promise(r => setTimeout(r, 1000));  // Check every second if resumed
      continue;
    }
    
    conversationNum++;
    const audioFile = `/tmp/jarvis-audio-${conversationNum}-${Date.now()}.wav`;
    
    try {
      console.log('═'.repeat(52));
      console.log(`  Conversation #${conversationNum}`);
      console.log('═'.repeat(52));
      console.log('');
      
      await recordAudio(audioFile);
      
      if (!fs.existsSync(audioFile)) {
        console.log('⚠️  No audio captured, trying again...');
        continue;
      }
      
      const stats = fs.statSync(audioFile);
      if (stats.size < 1000) {
        console.log('⚠️  Recording too short, trying again...');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      console.log(`✓ Captured ${stats.size} bytes`);
      console.log('🔄 Transcribing...');
      
      const transcription = await transcribe(audioFile);
      
      if (!transcription || transcription.length < 2) {
        console.log('⚠️  No speech detected, trying again...');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      console.log('');
      console.log(`👤 YOU: "${transcription}"`);
      console.log('');
      
      const lowerText = transcription.toLowerCase();
      
      // Exit command
      if (lowerText.includes('end conversation') && lowerText.includes('jarvis')) {
        await speak('Ending conversation. Goodbye!');
        fs.unlinkSync(audioFile);
        break;
      }
      
      // Clear history
      if (lowerText.includes('clear history')) {
        conversationHistory = [];
        await speak('Conversation history cleared.');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Save conversation
      if (lowerText.includes('save conversation')) {
        saveConversation(conversationHistory);
        await speak('Conversation saved.');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Load conversation
      if (lowerText.includes('load conversation')) {
        conversationHistory = loadConversation();
        await speak(`Loaded ${conversationHistory.length / 2} messages.`);
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Show statistics
      if (lowerText.includes('show stats') || lowerText.includes('show statistics')) {
        displayStats();
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Show help
      if (lowerText.includes('help')) {
        displayHelp();
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Pause command
      if (lowerText.includes('pause jarvis')) {
        isPaused = true;
        await speak('JARVIS paused. Say "resume jarvis" to continue.');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Resume command
      if (lowerText.includes('resume jarvis')) {
        isPaused = false;
        await speak('JARVIS resumed.');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Toggle auto-save
      if (lowerText.includes('toggle auto-save')) {
        autoSaveEnabled = !autoSaveEnabled;
        const status = autoSaveEnabled ? 'enabled' : 'disabled';
        await speak(`Auto-save ${status}.`);
        fs.unlinkSync(audioFile);
        continue;
      }
      
      console.log('💭 Thinking...');
      
      // Set timeout for the API call to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Response timeout')), sessionConfig.responseTimeout)
      );
      
      const responsePromise = getChatResponse(transcription, conversationHistory);
      
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      conversationHistory.push(
        { role: 'user', content: transcription },
        { role: 'assistant', content: response }
      );
      
      // Trim history if needed to prevent memory issues
      trimHistoryIfNeeded();
      
      // Auto-save if needed
      autoSaveIfNeeded();
      
      console.log('');
      await speak(response);
      console.log('');
      
      fs.unlinkSync(audioFile);
      
      console.log('─'.repeat(52));
      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (fs.existsSync(audioFile)) {
        fs.unlinkSync(audioFile);
      }
      
      // Provide verbal error feedback based on error type
      if (error.message.includes('API Error')) {
        await speak('API error occurred. Please check your API key and model settings.');
      } else if (error.message.includes('timeout')) {
        await speak('Request timed out. The AI service may be busy, please try again.');
      } else if (error.message.includes('Invalid response format')) {
        await speak('Received invalid response from AI service. This might be a temporary issue.');
      } else {
        await speak('An error occurred. Retrying in a moment.');
      }
      
      console.log('Retrying in 2 seconds...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('');
  console.log('👋 JARVIS shutting down...');
  
  // Final save before exit
  if (conversationHistory.length > 0) {
    saveConversation(conversationHistory);
    console.log('💾 Final conversation saved');
  }
  
  process.exit(0);
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 JARVIS shutting down...');
  
  // Attempt to save current conversation before exit
  if (conversationHistory.length > 0) {
    try {
      saveConversation(conversationHistory);
      console.log('💾 Current conversation saved before exit');
    } catch (e) {
      console.log('⚠️  Could not save conversation before exit');
    }
  }
  
  process.exit(0);
});

console.log('🚀 JARVIS starting up...');
main().catch(console.error);