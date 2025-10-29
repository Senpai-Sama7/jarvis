#!/usr/bin/env node

/**
 * Seamless Voice Interface for GitHub Copilot Chat
 * 
 * This creates a bridge between your voice and the Copilot session:
 * 1. Records your voice
 * 2. Transcribes with Groq Whisper
 * 3. Automatically sends to gh copilot chat
 * 4. Reads response aloud
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let isRecording = false;
let recordingProcess = null;

async function recordUntilSilence(outputFile) {
  return new Promise((resolve, reject) => {
    console.log('🎤 Listening... (speak now)');
    
    // Use sox to record with silence detection
    recordingProcess = spawn('sox', [
      '-d',           // Default input device
      '-t', 'wav',    // Output format
      outputFile,
      'silence', '1', '0.1', '1%',  // Start recording after detecting sound
      'silence', '1', '2', '5%'      // Stop after 2 seconds of silence below 5%
    ]);
    
    recordingProcess.on('close', (code) => {
      console.log('✓ Recording complete');
      resolve();
    });
    
    recordingProcess.on('error', reject);
  });
}

async function transcribe(audioFile) {
  console.log('🔄 Transcribing...');
  
  return new Promise((resolve, reject) => {
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('file', fs.createReadStream(audioFile));
    form.append('model', 'whisper-large-v3');
    form.append('response_format', 'text');
    
    const https = require('https');
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
      res.on('end', () => resolve(data.trim()));
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

async function sendToCopilot(prompt) {
  console.log('💭 Asking Copilot...\n');
  
  return new Promise((resolve, reject) => {
    // Use gh copilot in explain mode (non-interactive)
    exec(`gh copilot explain "${prompt.replace(/"/g, '\\"')}"`, 
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && !stdout) {
          reject(error);
        } else {
          resolve(stdout || stderr);
        }
      }
    );
  });
}

async function speak(text) {
  // Clean text for speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'code block')  // Replace code blocks
    .replace(/`[^`]+`/g, 'code')                // Replace inline code
    .replace(/\x1b\[[0-9;]*m/g, '')            // Remove ANSI
    .replace(/[📝💭🔊✓🎤🔄]/g, '')              // Remove emojis
    .slice(0, 1000);                            // Limit length
  
  return new Promise((resolve) => {
    exec(`which espeak-ng`, (err) => {
      if (err) {
        console.log('\n📢 Response:\n');
        console.log(text);
        resolve();
      } else {
        console.log('🔊 Speaking response...\n');
        console.log(text);
        console.log('');
        exec(`espeak-ng "${cleanText.replace(/"/g, '\\"')}" 2>/dev/null`, () => {
          resolve();
        });
      }
    });
  });
}

async function main() {
  console.log('🎙️  Seamless Voice Assistant for GitHub Copilot');
  console.log('━'.repeat(50));
  console.log('Requirements: sox, espeak-ng (optional)');
  console.log('Press Ctrl+C to exit\n');
  
  // Check for sox
  exec('which sox', (err) => {
    if (err) {
      console.error('❌ sox not found. Install with: sudo apt install sox');
      process.exit(1);
    }
  });
  
  while (true) {
    const audioFile = `/tmp/voice-input-${Date.now()}.wav`;
    
    try {
      // Record with automatic silence detection
      await recordUntilSilence(audioFile);
      
      // Check file size
      const stats = fs.statSync(audioFile);
      if (stats.size < 1000) {
        console.log('⚠️  Recording too short\n');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Transcribe
      const text = await transcribe(audioFile);
      console.log(`\n📝 You: "${text}"\n`);
      
      // Get Copilot response
      const response = await sendToCopilot(text);
      
      // Speak response
      await speak(response);
      
      // Cleanup
      fs.unlinkSync(audioFile);
      
      console.log('\n' + '─'.repeat(50) + '\n');
      console.log('Ready for next question...\n');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (fs.existsSync(audioFile)) {
        fs.unlinkSync(audioFile);
      }
    }
  }
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

main();
