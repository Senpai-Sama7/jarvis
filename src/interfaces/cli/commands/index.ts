import fs from 'fs';
import { createGroqClient } from '../../../core/ai/groq-client';
import { loadConfig } from '../../../core/config';
import { logger } from '../../../core/utils/logger';

const config = loadConfig();
const client = createGroqClient(process.env.GROQ_API_KEY || '', config.ai.model);

export async function generateCode(description: string, options: any) {
  const prompt = `Generate ${options.language} code for: ${description}`;
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are a code generation assistant. Provide only code with minimal comments.' },
      { role: 'user', content: prompt }
    ]
  });
  
  console.log(response.content);
  
  if (options.output) {
    fs.writeFileSync(options.output, response.content);
    logger.info(`Code saved to ${options.output}`);
  }
}

export async function explainCode(file: string) {
  const code = fs.readFileSync(file, 'utf-8');
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are a code explanation assistant. Explain code clearly and concisely.' },
      { role: 'user', content: `Explain this code:\n\n${code}` }
    ]
  });
  
  console.log(response.content);
}

export async function refactorCode(file: string, options: any) {
  const code = fs.readFileSync(file, 'utf-8');
  const prompt = options.suggestion 
    ? `Refactor this code with focus on: ${options.suggestion}\n\n${code}`
    : `Refactor and improve this code:\n\n${code}`;
    
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are a code refactoring assistant. Provide improved code with explanations.' },
      { role: 'user', content: prompt }
    ]
  });
  
  console.log(response.content);
}

export async function reviewCode(file: string) {
  const code = fs.readFileSync(file, 'utf-8');
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are a code review assistant. Provide constructive feedback on code quality, security, and best practices.' },
      { role: 'user', content: `Review this code:\n\n${code}` }
    ]
  });
  
  console.log(response.content);
}
