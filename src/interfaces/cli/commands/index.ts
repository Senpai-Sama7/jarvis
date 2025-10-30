/**
 * CLI Commands
 * Individual command implementations for the CLI interface
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../../core/config';
import { validateSecrets } from '../../../core/security/secrets';
import { createGroqClient } from '../../../core/ai/groq-client';
import { sanitizePrompt, sanitizeFilePath } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';

/**
 * Generate code from a description
 */
export async function generateCode(description: string, options: any): Promise<void> {
  logger.info('Generating code...');
  
  const config = loadConfig();
  validateSecrets(config.ai.provider);
  
  const apiKey = process.env.GROQ_API_KEY || '';
  const client = createGroqClient(apiKey, config.ai.model);
  
  const prompt = sanitizePrompt(`Generate ${options.language} code for the following:

${description}

Provide clean, well-documented code with comments explaining key parts.`);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are an expert programmer. Generate clean, efficient, well-documented code.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3, // Lower temperature for more deterministic code
  });
  
  console.log('\n📝 Generated Code:\n');
  console.log('━'.repeat(80));
  console.log(response.content);
  console.log('━'.repeat(80));
  
  if (options.output) {
    const outputPath = sanitizeFilePath(options.output);
    fs.writeFileSync(outputPath, response.content, 'utf-8');
    logger.info(`Code saved to ${outputPath}`);
  }
}

/**
 * Explain code from a file
 */
export async function explainCode(filePath: string): Promise<void> {
  logger.info(`Explaining code from ${filePath}...`);
  
  const config = loadConfig();
  validateSecrets(config.ai.provider);
  
  // Read file
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const code = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  
  const apiKey = process.env.GROQ_API_KEY || '';
  const client = createGroqClient(apiKey, config.ai.model);
  
  const prompt = sanitizePrompt(`Explain the following code:

\`\`\`${ext.substring(1)}
${code}
\`\`\`

Provide a clear explanation of:
1. What the code does
2. Key functions/classes
3. Important patterns or techniques used
4. Any potential issues or improvements`);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are an expert code reviewer and educator. Explain code clearly and thoroughly.' },
      { role: 'user', content: prompt },
    ],
  });
  
  console.log('\n📖 Code Explanation:\n');
  console.log('━'.repeat(80));
  console.log(response.content);
  console.log('━'.repeat(80));
}

/**
 * Refactor code from a file
 */
export async function refactorCode(filePath: string, options: any): Promise<void> {
  logger.info(`Refactoring code from ${filePath}...`);
  
  const config = loadConfig();
  validateSecrets(config.ai.provider);
  
  // Read file
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const code = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  
  const apiKey = process.env.GROQ_API_KEY || '';
  const client = createGroqClient(apiKey, config.ai.model);
  
  let prompt = `Refactor the following code to improve readability, performance, and maintainability:

\`\`\`${ext.substring(1)}
${code}
\`\`\`
`;
  
  if (options.suggestion) {
    prompt += `\n\nSpecific focus: ${options.suggestion}`;
  }
  
  prompt = sanitizePrompt(prompt);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are an expert software engineer specializing in code refactoring. Provide improved code with clear explanations of changes.' },
      { role: 'user', content: prompt },
    ],
  });
  
  console.log('\n🔧 Refactored Code:\n');
  console.log('━'.repeat(80));
  console.log(response.content);
  console.log('━'.repeat(80));
}

/**
 * Review code from a file
 */
export async function reviewCode(filePath: string): Promise<void> {
  logger.info(`Reviewing code from ${filePath}...`);
  
  const config = loadConfig();
  validateSecrets(config.ai.provider);
  
  // Read file
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const code = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  
  const apiKey = process.env.GROQ_API_KEY || '';
  const client = createGroqClient(apiKey, config.ai.model);
  
  const prompt = sanitizePrompt(`Review the following code and provide detailed feedback:

\`\`\`${ext.substring(1)}
${code}
\`\`\`

Please analyze:
1. Code quality and best practices
2. Potential bugs or issues
3. Security concerns
4. Performance considerations
5. Suggestions for improvement`);
  
  const response = await client.chat({
    messages: [
      { role: 'system', content: 'You are a senior code reviewer. Provide constructive, detailed feedback on code quality, security, and best practices.' },
      { role: 'user', content: prompt },
    ],
  });
  
  console.log('\n🔍 Code Review:\n');
  console.log('━'.repeat(80));
  console.log(response.content);
  console.log('━'.repeat(80));
}
