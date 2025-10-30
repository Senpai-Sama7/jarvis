/**
 * Code API Routes
 */

import { Router, Request, Response } from 'express';
import { loadConfig } from '../../../core/config';
import { validateSecrets } from '../../../core/security/secrets';
import { createGroqClient } from '../../../core/ai/groq-client';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';

export const codeRouter = Router();

/**
 * POST /api/code/generate
 * Generate code from description
 */
codeRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { description, language = 'typescript' } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Description is required and must be a string',
      });
    }
    
    const config = loadConfig();
    validateSecrets(config.ai.provider);
    
    const apiKey = process.env.GROQ_API_KEY || '';
    const client = createGroqClient(apiKey, config.ai.model);
    
    const prompt = sanitizePrompt(`Generate ${language} code for the following:

${description}

Provide clean, well-documented code with comments explaining key parts.`);
    
    const response = await client.chat({
      messages: [
        { role: 'system', content: 'You are an expert programmer. Generate clean, efficient, well-documented code.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });
    
    res.json({
      code: response.content,
      language,
      usage: response.usage,
    });
    
  } catch (error) {
    logger.error('Code generation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate code',
    });
  }
});

/**
 * POST /api/code/explain
 * Explain code
 */
codeRouter.post('/explain', async (req: Request, res: Response) => {
  try {
    const { code, language = 'typescript' } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Code is required and must be a string',
      });
    }
    
    const config = loadConfig();
    validateSecrets(config.ai.provider);
    
    const apiKey = process.env.GROQ_API_KEY || '';
    const client = createGroqClient(apiKey, config.ai.model);
    
    const prompt = sanitizePrompt(`Explain the following ${language} code:

\`\`\`${language}
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
    
    res.json({
      explanation: response.content,
      usage: response.usage,
    });
    
  } catch (error) {
    logger.error('Code explanation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to explain code',
    });
  }
});

/**
 * POST /api/code/refactor
 * Refactor code
 */
codeRouter.post('/refactor', async (req: Request, res: Response) => {
  try {
    const { code, language = 'typescript', suggestion } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Code is required and must be a string',
      });
    }
    
    const config = loadConfig();
    validateSecrets(config.ai.provider);
    
    const apiKey = process.env.GROQ_API_KEY || '';
    const client = createGroqClient(apiKey, config.ai.model);
    
    let prompt = `Refactor the following ${language} code to improve readability, performance, and maintainability:

\`\`\`${language}
${code}
\`\`\`
`;
    
    if (suggestion) {
      prompt += `\n\nSpecific focus: ${suggestion}`;
    }
    
    prompt = sanitizePrompt(prompt);
    
    const response = await client.chat({
      messages: [
        { role: 'system', content: 'You are an expert software engineer specializing in code refactoring. Provide improved code with clear explanations of changes.' },
        { role: 'user', content: prompt },
      ],
    });
    
    res.json({
      refactoredCode: response.content,
      usage: response.usage,
    });
    
  } catch (error) {
    logger.error('Code refactoring error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refactor code',
    });
  }
});

/**
 * POST /api/code/review
 * Review code
 */
codeRouter.post('/review', async (req: Request, res: Response) => {
  try {
    const { code, language = 'typescript' } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Code is required and must be a string',
      });
    }
    
    const config = loadConfig();
    validateSecrets(config.ai.provider);
    
    const apiKey = process.env.GROQ_API_KEY || '';
    const client = createGroqClient(apiKey, config.ai.model);
    
    const prompt = sanitizePrompt(`Review the following ${language} code and provide detailed feedback:

\`\`\`${language}
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
    
    res.json({
      review: response.content,
      usage: response.usage,
    });
    
  } catch (error) {
    logger.error('Code review error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to review code',
    });
  }
});
