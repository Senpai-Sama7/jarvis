#!/usr/bin/env node

/**
 * JARVIS - Enhanced Voice Assistant with Full Feature Set
 * Advanced capabilities with better UX, performance, and reliability
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
} = require('./voice-core');

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

// ============================================================================ 
// ADVANCED UTILITY FUNCTIONS
// ============================================================================ 

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

// ============================================================================ 
// ENHANCED CONVERSATION MANAGEMENT
// ============================================================================ 

function trimHistoryIfNeeded() {
  // Keep only the most recent messages to prevent memory issues
  if (conversationHistory.length > sessionConfig.maxHistoryLength) {
    conversationHistory = conversationHistory.slice(-sessionConfig.maxHistoryLength);
    console.log(`✂️  History trimmed to ${sessionConfig.maxHistoryLength} most recent messages`);
  }
}

function autoSaveIfNeeded() {
  if (autoSaveEnabled && conversationCount % sessionConfig.autoSaveInterval === 0) {
    saveConversation(conversationHistory);
    console.log(`💾 Auto-saved at conversation #${conversationCount}`);
  }
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
// ADVANCED MAIN LOOP WITH PAUSE/RESUME
// ============================================================================ 

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║      🚀 ADVANCED JARVIS - Enhanced Voice Assistant  ║');
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
  console.log('  • "pause jarvis" - Pause listening');
  console.log('  • "resume jarvis" - Resume listening');
  console.log('  • "toggle auto-save" - Turn auto-save on/off');
  console.log('  • "help" - Show available commands');
  console.log('  • Press Ctrl+C twice to force exit');
  console.log('');
  console.log('Starting in 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  console.log('');
  
  while (true) {
    if (isPaused) {
      console.log('⏸️  JARVIS is paused. Say "resume jarvis" to continue...');
      await new Promise(r => setTimeout(r, 1000));  // Check every second if resumed
      continue;
    }
    
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

console.log('🚀 Advanced JARVIS starting up...');
main().catch(console.error);