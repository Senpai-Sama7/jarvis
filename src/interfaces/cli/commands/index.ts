import fs from 'fs';
import { createGroqClient } from '../../../core/ai/groq-client';
import { loadConfig } from '../../../core/config';
import { logger } from '../../../core/utils/logger';
import { executor } from '../../../core/execution/executor';

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

export async function executeCommand(command: string, options: any) {
  logger.info(`Executing: ${command}`);
  
  const result = await executor.executeCommand(command, {
    cwd: options.cwd,
    timeout: options.timeout
  });

  if (result.success) {
    console.log('✓ Success');
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
  } else {
    console.error('✗ Failed');
    console.error(result.error);
  }
}

export async function aiExecute(prompt: string, options: any) {
  logger.info(`AI Execute: ${prompt}`);
  
  const response = await client.chat({
    messages: [
      {
        role: 'system',
        content: `You are a code execution assistant. Generate executable commands or code.
        
Respond in JSON: {"type": "command|code", "language": "bash|js|py", "content": "...", "explanation": "..."}`
      },
      { role: 'user', content: prompt }
    ]
  });

  try {
    const parsed = JSON.parse(response.content);
    
    console.log(`\n📝 ${parsed.explanation}\n`);
    console.log(`Type: ${parsed.type}`);
    console.log(`Language: ${parsed.language}\n`);
    console.log('Code:');
    console.log(parsed.content);
    console.log();

    if (!options.dryRun) {
      console.log('Executing...\n');
      
      let result;
      if (parsed.type === 'command') {
        result = await executor.executeCommand(parsed.content);
      } else {
        result = await executor.executeCode(parsed.content, parsed.language);
      }

      if (result.success) {
        console.log('✓ Success');
        if (result.stdout) console.log(result.stdout);
      } else {
        console.error('✗ Failed');
        console.error(result.error);
      }
    }
  } catch {
    console.log(response.content);
  }
}
