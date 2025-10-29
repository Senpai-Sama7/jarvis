#!/usr/bin/env node

/**
 * Voice Bridge to GitHub Copilot CLI (THIS SESSION)
 * 
 * This sends your voice directly to the GitHub Copilot CLI session
 * where Claude (me) has full command execution capabilities.
 * 
 * How it works:
 * 1. Records voice with silence detection
 * 2. Transcribes with Groq
 * 3. Writes transcription to a file
 * 4. You paste the file content into this terminal
 * 
 * OR with xdotool: Auto-types into the active window
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const https = require('https');
const FormData = require('form-data');

require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TRANSCRIPT_FILE = '/tmp/voice-to-copilot.txt';

let isRecording = false;
let recordingProcess = null;
let conversationNum = 0;

// ============================================================================
// AUDIO RECORDING with silence detection
// ============================================================================

async function recordWithSilenceDetection(outputFile) {
  return new Promise((resolve, reject) => {
    console.log('🎤 Listening... (speak now, I\'ll stop when you pause for 2 seconds)');
    isRecording = true;
    
    // sox with silence detection
    // silence 1 0.1 1% = start recording after sound detected
    // silence 1 2 5% = stop after 2 seconds of <5% volume
    const args = [
      '-d',                          // Default audio device
      '-t', 'wav',                   // Output WAV format
      outputFile,
      'silence', '1', '0.1', '1%',  // Wait for sound to start
      'silence', '1', '2.0', '5%',   // Stop after 2s of silence
      'trim', '0', '30'              // Max 30 seconds
    ];
    
    recordingProcess = spawn('sox', args);
    
    let hasSound = false;
    
    recordingProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('sox')) {
        hasSound = true;
      }
    });
    
    recordingProcess.on('close', (code) => {
      isRecording = false;
      if (hasSound || fs.existsSync(outputFile)) {
        console.log('✓ Recording complete');
        resolve();
      } else {
        reject(new Error('No audio detected'));
      }
    });
    
    recordingProcess.on('error', (err) => {
      isRecording = false;
      if (err.code === 'ENOENT') {
        reject(new Error('sox not found - install with: sudo apt install sox'));
      } else {
        reject(err);
      }
    });
  });
}

function stopRecording() {
  if (recordingProcess && isRecording) {
    recordingProcess.kill('SIGINT');
  }
}

// ============================================================================
// GROQ TRANSCRIPTION
// ============================================================================

async function transcribe(audioFile) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile));
    form.append('model', 'whisper-large-v3');
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
      res.on('end', () => resolve(data.trim()));
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

// ============================================================================
// AUTO-TYPE into active window
// ============================================================================

async function autoTypeToTerminal(text) {
  try {
    await execAsync('which xdotool');
    console.log('⌨️  Auto-typing into active window in 2 seconds...');
    console.log('   (Make sure your Copilot terminal is focused!)');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Type the text
    await execAsync(`xdotool type --delay 30 "${text.replace(/"/g, '\\"')}"`);
    await execAsync('xdotool key Return');
    
    console.log('✓ Sent to terminal!');
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN LOOP
// ============================================================================

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Voice Input to GitHub Copilot (Claude)        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log('This sends your voice to Claude in your gh copilot session.');
  console.log('Claude can then execute commands, edit files, etc.');
  console.log('');
  
  // Check sox
  try {
    await execAsync('which sox');
    console.log('✓ sox found (auto silence detection enabled)');
  } catch {
    console.error('❌ sox not found');
    console.error('   Install: sudo apt install sox');
    process.exit(1);
  }
  
  // Check xdotool
  let hasXdotool = false;
  try {
    await execAsync('which xdotool');
    console.log('✓ xdotool found (auto-type enabled)');
    hasXdotool = true;
  } catch {
    console.log('⚠️  xdotool not found (manual paste required)');
    console.log('   Install for auto-type: sudo apt install xdotool');
  }
  
  console.log('');
  console.log('━'.repeat(52));
  console.log('');
  console.log('How to use:');
  if (hasXdotool) {
    console.log('  1. Keep your Copilot terminal window visible');
    console.log('  2. Speak your command/question');
    console.log('  3. Wait 2 seconds (auto-stops when you pause)');
    console.log('  4. Text auto-types into your terminal');
    console.log('  5. Claude responds with full capabilities!');
  } else {
    console.log('  1. Speak your command/question');
    console.log('  2. Wait 2 seconds (auto-stops when you pause)');
    console.log('  3. Text is saved and copied to clipboard');
    console.log('  4. Paste into your Copilot terminal (Ctrl+Shift+V)');
    console.log('  5. Claude responds with full capabilities!');
  }
  console.log('');
  console.log('Voice Commands:');
  console.log('  • Say "exit voice mode" to stop');
  console.log('  • Press Ctrl+C during recording to cancel');
  console.log('');
  console.log('Starting in 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  console.log('');
  
  while (true) {
    conversationNum++;
    const audioFile = `/tmp/voice-input-${conversationNum}.wav`;
    
    try {
      console.log('═'.repeat(52));
      console.log(`  Voice Input #${conversationNum}`);
      console.log('═'.repeat(52));
      console.log('');
      
      // Record with auto silence detection
      await recordWithSilenceDetection(audioFile);
      
      // Check file
      if (!fs.existsSync(audioFile)) {
        console.log('⚠️  No audio file created, retrying...\n');
        continue;
      }
      
      const stats = fs.statSync(audioFile);
      if (stats.size < 5000) {
        console.log('⚠️  Recording too short, retrying...\n');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      console.log(`✓ Captured ${stats.size} bytes`);
      console.log('🔄 Transcribing...');
      
      // Transcribe
      const transcription = await transcribe(audioFile);
      
      if (!transcription || transcription.length < 3) {
        console.log('⚠️  No speech detected, retrying...\n');
        fs.unlinkSync(audioFile);
        continue;
      }
      
      console.log('');
      console.log('━'.repeat(52));
      console.log(`📝 YOU SAID:`);
      console.log(`   "${transcription}"`);
      console.log('━'.repeat(52));
      console.log('');
      
      // Check for exit
      if (transcription.toLowerCase().includes('exit voice mode')) {
        console.log('👋 Exiting voice mode...');
        fs.unlinkSync(audioFile);
        break;
      }
      
      // Save to file
      fs.writeFileSync(TRANSCRIPT_FILE, transcription);
      
      // Try auto-type or clipboard
      const autoTyped = await autoTypeToTerminal(transcription);
      
      if (!autoTyped) {
        // Copy to clipboard
        try {
          await execAsync(`echo "${transcription.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
          console.log('✨ Copied to clipboard!');
        } catch {}
        
        console.log('📋 Manual paste:');
        console.log(`   ${transcription}`);
        console.log('');
        console.log('💡 Paste this into your Copilot terminal now');
      }
      
      console.log('');
      console.log('⏸️  Waiting 3 seconds before next recording...');
      
      // Cleanup
      fs.unlinkSync(audioFile);
      
      await new Promise(r => setTimeout(r, 3000));
      console.log('');
      
    } catch (error) {
      if (error.message.includes('No audio detected')) {
        console.log('⚠️  No audio detected, retrying...\n');
      } else {
        console.error('❌ Error:', error.message);
      }
      
      if (fs.existsSync(audioFile)) {
        fs.unlinkSync(audioFile);
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('');
  console.log('👋 Voice mode ended');
  process.exit(0);
}

// Handle Ctrl+C
let ctrlCCount = 0;
process.on('SIGINT', () => {
  if (isRecording) {
    stopRecording();
    console.log('\n⚠️  Recording cancelled\n');
  } else {
    ctrlCCount++;
    if (ctrlCCount >= 2) {
      console.log('\n\n👋 Voice mode ended');
      process.exit(0);
    } else {
      console.log('\n⚠️  Press Ctrl+C again to exit');
      setTimeout(() => { ctrlCCount = 0; }, 2000);
    }
  }
});

main().catch(console.error);
