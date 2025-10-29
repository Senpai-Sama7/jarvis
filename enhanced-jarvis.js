#!/usr/bin/env node

/**
 * Enhanced JARVIS - Fully Automated Voice Assistant
 * With additional features, better error handling, and performance metrics
 */

const fs = require('fs');
const {
  checkAndFixAudio,
  recordAudio,
  transcribe,
  getChatResponse,
  speak,
  saveConversation,
  loadConversation,
  getPerformanceStats,
  validateConfig
} = require('./enhanced-voice-core');

let conversationHistory = [];
let isRecording = false;
let sessionStartTime = Date.now();
let conversationCount = 0;

// ============================================================================
// ENHANCED UTILITY FUNCTIONS
// ============================================================================

function displayStats() {
  const stats = getPerformanceStats(sessionStartTime);
  console.log('');
  console.log('📊 Session Statistics:');
  console.log(`  • Uptime: ${(stats.uptime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  • Conversations: ${conversationCount}`);
  console.log(`  • History Length: ${conversationHistory.length} messages`);
  console.log(`  • Timestamp: ${stats.timestamp}`);
  console.log('');
}

function displayHelp() {
  console.log('');
  console.log('📋 Available Commands:');
  console.log('  • "end conversation jarvis"      - Exit the assistant');
  console.log('  • "clear history"                - Reset conversation');
  console.log('  • "save conversation"            - Save to file');
  console.log('  • "load conversation"            - Load from file');
  console.log('  • "show stats"                   - Display session info');
  console.log('  • "help"                         - Show this help');
  console.log('  • Press Ctrl+C twice             - Emergency exit');
  console.log('');
}

// ============================================================================
// CONFIGURATION AND VALIDATION
// ============================================================================

function checkConfiguration() {
  console.log('🔧 Checking configuration...');
  const configValidation = validateConfig();
  
  if (!configValidation.isValid) {
    console.error('❌ Configuration issues found:');
    configValidation.errors.forEach(error => console.error(`  • ${error}`));
    console.log('');
    console.log('Please update your .env file with the required information.');
    return false;
  }
  
  console.log('✅ Configuration is valid');
  return true;
}

// ============================================================================
// ENHANCED MAIN LOOP
// ============================================================================

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        🚀 ENHANCED JARVIS - Voice Assistant        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  
  if (!checkConfiguration()) {
    process.exit(1);
  }
  
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
  console.log('  • "help" - Show available commands');
  console.log('  • Press Ctrl+C twice to force exit');
  console.log('');
  console.log('Starting in 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  console.log('');
  
  while (true) {
    conversationCount++;
    const audioFile = `/tmp/jarvis-audio-${Date.now()}.wav`;
    
    try {
      console.log('═'.repeat(52));
      console.log(`  Conversation #${conversationCount}`);
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
      
      console.log('💭 Thinking...');
      
      const response = await getChatResponse(transcription, conversationHistory);
      
      conversationHistory.push(
        { role: 'user', content: transcription },
        { role: 'assistant', content: response }
      );
      
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
      
      // Provide verbal error feedback
      if (error.message.includes('API Error')) {
        await speak('API error occurred. Please check your API key and model settings.');
      } else {
        await speak('An error occurred. Retrying in a moment.');
      }
      
      console.log('Retrying in 2 seconds...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('');
  console.log('👋 JARVIS shutting down...');
  process.exit(0);
}

process.on('SIGINT', () => {
  console.log('\\n\\n👋 JARVIS shutting down...');
  process.exit(0);
});

console.log('🚀 Enhanced JARVIS starting up...');
main().catch(console.error);