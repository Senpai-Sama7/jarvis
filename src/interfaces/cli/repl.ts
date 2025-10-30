/**
 * Interactive REPL Mode
 * Provides an interactive chat interface in the terminal
 */

import readline from 'readline';
import { loadConfig } from '../../core/config';
import { validateSecrets } from '../../core/security/secrets';
import { createGroqClient } from '../../core/ai/groq-client';
import { sanitizePrompt } from '../../core/security/sanitizer';
import { logger } from '../../core/utils/logger';
import { Message } from '../../types';

interface REPLOptions {
  voice: boolean;
}

export async function startInteractiveMode(options: REPLOptions): Promise<void> {
  logger.info('Starting JARVIS Interactive Mode');
  
  // Load configuration
  const config = loadConfig();
  validateSecrets(config.ai.provider);
  
  // Create AI client
  const apiKey = process.env.GROQ_API_KEY || '';
  const client = createGroqClient(apiKey, config.ai.model);
  
  // Initialize conversation history
  const conversationHistory: Message[] = [
    {
      role: 'system',
      content: 'You are JARVIS, an advanced AI coding assistant. You help with code generation, explanation, refactoring, debugging, and general programming questions. Be concise, accurate, and helpful.',
    },
  ];
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\n💬 You: ',
  });
  
  console.log('\n🤖 JARVIS Interactive Mode');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Type your questions or commands. Type "exit" or "quit" to leave.\n');
  console.log('Commands:');
  console.log('  - exit/quit     : Exit the chat');
  console.log('  - clear         : Clear conversation history');
  console.log('  - help          : Show this help message');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  rl.prompt();
  
  rl.on('line', async (input: string) => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      rl.prompt();
      return;
    }
    
    // Handle commands
    if (trimmedInput === 'exit' || trimmedInput === 'quit') {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);
    }
    
    if (trimmedInput === 'clear') {
      conversationHistory.length = 1; // Keep system message
      console.log('\n🔄 Conversation history cleared.\n');
      rl.prompt();
      return;
    }
    
    if (trimmedInput === 'help') {
      console.log('\n📋 Available Commands:');
      console.log('  - exit/quit     : Exit the chat');
      console.log('  - clear         : Clear conversation history');
      console.log('  - help          : Show this help message\n');
      rl.prompt();
      return;
    }
    
    try {
      // Sanitize input
      const sanitizedInput = sanitizePrompt(trimmedInput);
      
      // Add user message to history
      conversationHistory.push({
        role: 'user',
        content: sanitizedInput,
        timestamp: new Date(),
      });
      
      // Show loading indicator
      process.stdout.write('\n🤖 JARVIS: ');
      
      // Get response from AI
      let response = '';
      
      if (config.ai.provider === 'groq') {
        // Use streaming for better UX
        for await (const chunk of client.streamChat({
          messages: conversationHistory,
          temperature: config.ai.temperature,
          maxTokens: config.ai.maxTokens,
        })) {
          process.stdout.write(chunk);
          response += chunk;
        }
      } else {
        // Fallback to non-streaming
        const completion = await client.chat({
          messages: conversationHistory,
          temperature: config.ai.temperature,
          maxTokens: config.ai.maxTokens,
        });
        response = completion.content;
        process.stdout.write(response);
      }
      
      console.log('\n'); // New line after response
      
      // Add assistant response to history
      conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });
      
      // Trim history if it gets too long
      if (conversationHistory.length > 20) {
        conversationHistory.splice(1, 2); // Remove oldest user-assistant pair
      }
      
    } catch (error) {
      logger.error('Error in chat:', error);
      console.log('\n❌ Error: Failed to get response. Please try again.\n');
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  });
}
