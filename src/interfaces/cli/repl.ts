import * as readline from 'readline';
import { createGroqClient } from '../../core/ai/groq-client';
import { loadConfig } from '../../core/config';
import { logger } from '../../core/utils/logger';
import { Message } from '../../types';

export async function startInteractiveMode(options: any): Promise<void> {
  const config = loadConfig();
  const client = createGroqClient(process.env.GROQ_API_KEY || '', config.ai.model);
  const history: Message[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: '
  });

  console.log('JARVIS Interactive Mode');
  console.log('Type "exit" to quit\n');
  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();
    
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    if (!input) {
      rl.prompt();
      return;
    }

    try {
      history.push({ role: 'user', content: input });
      
      const response = await client.chat({
        messages: [
          { role: 'system', content: 'You are JARVIS, a helpful AI assistant.' },
          ...history.slice(-10)
        ]
      });

      history.push({ role: 'assistant', content: response.content });
      console.log(`\nJARVIS: ${response.content}\n`);
    } catch (error: any) {
      logger.error('Chat error:', error);
      console.log('\nError: Failed to get response\n');
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}
