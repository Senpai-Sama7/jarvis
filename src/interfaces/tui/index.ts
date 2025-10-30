#!/usr/bin/env node
/**
 * JARVIS Terminal User Interface
 * Beautiful TUI for interacting with JARVIS
 */

// @ts-ignore
import blessed from 'blessed';
// @ts-ignore
import contrib from 'blessed-contrib';
import { createGroqClient } from '../../core/ai/groq-client';
import { loadConfig } from '../../core/config';

const config = loadConfig();
const client = createGroqClient(
  process.env.GROQ_API_KEY || '',
  config.ai.model
);

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'JARVIS - AI Assistant',
  fullUnicode: true,
});

// Create grid layout
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// Header
const header = grid.set(0, 0, 1, 12, blessed.box, {
  content: ' 🤖 JARVIS - AI Coding Assistant | Press Ctrl+C to exit | Tab to switch focus ',
  style: {
    fg: 'white',
    bg: 'blue',
    bold: true,
  },
});

// Chat history
const chatBox = grid.set(1, 0, 8, 8, blessed.log, {
  label: ' Conversation ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' },
    focus: { border: { fg: 'green' } },
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '█',
    style: { fg: 'cyan' },
  },
  keys: true,
  vi: true,
  mouse: true,
});

// Stats panel
const statsBox = grid.set(1, 8, 4, 4, blessed.box, {
  label: ' Statistics ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'yellow' },
  },
  content: '',
});

// Status panel
const statusBox = grid.set(5, 8, 4, 4, blessed.box, {
  label: ' Status ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'magenta' },
  },
  content: '{green-fg}● Ready{/green-fg}',
  tags: true,
});

// Input box
const inputBox = grid.set(9, 0, 3, 12, blessed.textarea, {
  label: ' Your Message (Enter to send, Esc to clear) ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'green' },
    focus: { border: { fg: 'yellow' } },
  },
  inputOnFocus: true,
  keys: true,
  mouse: true,
});

// State
let messageCount = 0;
let conversationHistory: Array<{ role: string; content: string }> = [];

// Update stats
function updateStats() {
  const stats = `
  Messages: {cyan-fg}${messageCount}{/cyan-fg}
  Model: {yellow-fg}${config.ai.model}{/yellow-fg}
  Tokens: {green-fg}${conversationHistory.reduce((acc, m) => acc + m.content.length / 4, 0).toFixed(0)}{/green-fg}
  `;
  statsBox.setContent(stats);
  screen.render();
}

// Add message to chat
function addMessage(role: string, content: string) {
  const timestamp = new Date().toLocaleTimeString();
  const color = role === 'user' ? 'cyan' : 'green';
  const icon = role === 'user' ? '👤' : '🤖';
  
  chatBox.log(`{bold}${icon} ${role.toUpperCase()}{/bold} {gray-fg}[${timestamp}]{/gray-fg}`);
  chatBox.log(`{${color}-fg}${content}{/${color}-fg}`);
  chatBox.log('');
  
  conversationHistory.push({ role, content });
  messageCount++;
  updateStats();
}

// Send message
async function sendMessage(message: string) {
  if (!message.trim()) return;

  addMessage('user', message);
  statusBox.setContent('{yellow-fg}● Processing...{/yellow-fg}');
  screen.render();

  try {
    const response = await client.chat({
      messages: [
        { role: 'system', content: 'You are JARVIS, a helpful AI assistant. Be concise.' },
        ...conversationHistory.map(m => ({ role: m.role as any, content: m.content })),
      ],
    });

    addMessage('assistant', response.content);
    statusBox.setContent('{green-fg}● Ready{/green-fg}');
  } catch (error: any) {
    addMessage('system', `Error: ${error.message}`);
    statusBox.setContent('{red-fg}● Error{/red-fg}');
  }

  screen.render();
}

// Input handling
inputBox.key('enter', async () => {
  const message = inputBox.getValue();
  inputBox.clearValue();
  await sendMessage(message);
  inputBox.focus();
});

inputBox.key('escape', () => {
  inputBox.clearValue();
  screen.render();
});

// Tab to switch focus
screen.key('tab', () => {
  if (screen.focused === inputBox) {
    chatBox.focus();
  } else {
    inputBox.focus();
  }
});

// Quit
screen.key(['C-c', 'q'], () => {
  return process.exit(0);
});

// Help
screen.key('?', () => {
  addMessage('system', 'Commands: Enter=Send, Esc=Clear, Tab=Switch, ?=Help, q=Quit');
});

// Initial setup
chatBox.log('{bold}{cyan-fg}Welcome to JARVIS!{/cyan-fg}{/bold}');
chatBox.log('{gray-fg}Type your message and press Enter to chat.{/gray-fg}');
chatBox.log('');

updateStats();
inputBox.focus();
screen.render();
