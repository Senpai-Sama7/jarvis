#!/usr/bin/env node

/**
 * Advanced Voice Mode with tmux integration
 * 
 * Creates a split-screen setup:
 * - Left pane: Voice input (auto-transcribes and copies)
 * - Right pane: GitHub Copilot CLI session
 * - Bottom status: Shows transcriptions
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');

require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function checkDependencies() {
  const deps = ['sox', 'tmux'];
  const missing = [];
  
  for (const dep of deps) {
    try {
      await execAsync(`which ${dep}`);
    } catch {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    console.error(`❌ Missing dependencies: ${missing.join(', ')}`);
    console.error(`Install with: sudo apt install ${missing.join(' ')}`);
    process.exit(1);
  }
}

async function setupTmux() {
  const sessionName = 'copilot-voice';
  
  // Kill existing session if any
  try {
    await execAsync(`tmux kill-session -t ${sessionName} 2>/dev/null`);
  } catch {}
  
  console.log('🎬 Setting up voice mode environment...');
  
  // Create new tmux session with split panes
  await execAsync(`tmux new-session -d -s ${sessionName}`);
  
  // Split horizontally
  await execAsync(`tmux split-window -h -t ${sessionName}`);
  
  // Run voice input loop in left pane
  const voiceScript = `${__dirname}/voice-mode.sh`;
  await execAsync(`tmux send-keys -t ${sessionName}:0.0 "${voiceScript}" C-m`);
  
  // Message in right pane
  await execAsync(`tmux send-keys -t ${sessionName}:0.1 "echo '🎙️ Voice Mode Active - Start gh copilot here'" C-m`);
  await execAsync(`tmux send-keys -t ${sessionName}:0.1 "echo 'Paste transcribed text from left pane'" C-m`);
  await execAsync(`tmux send-keys -t ${sessionName}:0.1 "echo ''" C-m`);
  
  // Attach to session
  console.log('✓ Environment ready');
  console.log('🚀 Launching voice mode...\n');
  
  const tmux = spawn('tmux', ['attach-session', '-t', sessionName], {
    stdio: 'inherit'
  });
  
  tmux.on('close', () => {
    console.log('\n👋 Voice mode deactivated');
    process.exit(0);
  });
}

async function main() {
  console.log('🎙️  Advanced Voice Mode for GitHub Copilot');
  console.log('━'.repeat(50));
  
  await checkDependencies();
  await setupTmux();
}

main().catch(console.error);
