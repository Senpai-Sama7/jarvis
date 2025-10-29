#!/usr/bin/env node

/**
 * Fully Automated Voice Mode with Screen Reader
 * 
 * The complete hands-free experience:
 * 1. Records your voice continuously
 * 2. Transcribes with Groq
 * 3. Auto-types into terminal
 * 4. Captures response from terminal
 * 5. Reads response aloud with TTS
 * 6. Repeat
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const pty = require('node-pty');

require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let isRecording = false;
let recordingProcess = null;
let lastOutputTime = Date.now();
let responseBuffer = '';
let waitingForResponse = false;

async function recordUntilInterrupt(outputFile) {
  return new Promise((resolve, reject) => {
    console.log('🎤 Listening... (Ctrl+C when done)');
    
    recordingProcess = spawn('sox', ['-d', '-t', 'wav', outputFile]);
    
    recordingProcess.on('close', () => {
      console.log('✓ Recording complete');
      resolve();
    });
    
    recordingProcess.on('error', reject);
  });
}

function stopRecording() {
  if (recordingProcess) {
    recordingProcess.kill('SIGINT');
    recordingProcess = null;
  }
}

async function transcribe(audioFile) {
  console.log('🔄 Transcribing...');
  
  const FormData = require('form-data');
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile));
    form.append('model', 'whisper-large-v3');
    form.append('response_format', 'text');
    
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

async function speak(text) {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/`[^`]+`/g, 'code')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/[📝💭🔊✓🎤🔄❌✨]/g, '')
    .slice(0, 2000);
  
  return new Promise((resolve) => {
    exec(`which espeak-ng`, (err) => {
      if (err) {
        console.log('\n📢 Response:', text);
        resolve();
      } else {
        console.log('🔊 Speaking response...');
        exec(`espeak-ng "${cleanText.replace(/"/g, '\\"')}" 2>/dev/null`, () => {
          resolve();
        });
      }
    });
  });
}

async function main() {
  console.log('🎙️  Fully Automated Voice Mode for GitHub Copilot');
  console.log('━'.repeat(50));
  console.log('');
  console.log('This mode provides a complete hands-free experience:');
  console.log('  • Speak naturally');
  console.log('  • Press Ctrl+C to send');
  console.log('  • Listen to response');
  console.log('  • Repeat');
  console.log('');
  
  // Check for required tools
  try {
    await execAsync('which sox');
    await execAsync('which espeak-ng');
  } catch {
    console.error('❌ Install dependencies: sudo apt install sox espeak-ng');
    process.exit(1);
  }
  
  console.log('✓ Starting voice assistant');
  console.log('✓ Connected to GitHub Copilot CLI');
  console.log('');
  
  // Start gh copilot in a pseudo-terminal
  const ptyProcess = pty.spawn('gh', ['copilot', 'suggest', '-t', 'shell'], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
  });
  
  let conversationNum = 0;
  
  // Capture output from gh copilot
  ptyProcess.onData((data) => {
    if (waitingForResponse) {
      responseBuffer += data;
      lastOutputTime = Date.now();
    }
    process.stdout.write(data);
  });
  
  // Voice input loop
  while (true) {
    conversationNum++;
    const audioFile = `/tmp/voice-input-${conversationNum}.wav`;
    
    try {
      console.log('\n' + '═'.repeat(50));
      console.log(`🎤 Recording #${conversationNum}...`);
      console.log('═'.repeat(50) + '\n');
      
      // Record audio
      await recordUntilInterrupt(audioFile);
      
      // Check file size
      const stats = fs.statSync(audioFile);
      if (stats.size < 1000) {
        console.log('⚠️  Recording too short\n');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Transcribe
      const text = await transcribe(audioFile);
      console.log(`\n📝 YOU: "${text}"\n`);
      
      // Send to gh copilot
      responseBuffer = '';
      waitingForResponse = true;
      ptyProcess.write(text + '\r');
      
      // Wait for response to complete
      console.log('💭 Waiting for response...\n');
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (Date.now() - lastOutputTime > 2000) {
            clearInterval(checkInterval);
            waitingForResponse = false;
            resolve();
          }
        }, 500);
      });
      
      // Speak the response
      if (responseBuffer.trim()) {
        await speak(responseBuffer);
      }
      
      // Cleanup
      fs.unlinkSync(audioFile);
      
      console.log('\n' + '─'.repeat(50));
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
  stopRecording();
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

main().catch(console.error);
