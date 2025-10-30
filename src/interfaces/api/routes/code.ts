import { Router, Request, Response } from 'express';
import { aiClientManager } from '../../../core/ai/client-manager';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';
import { AIError } from '../../../types';

const router = Router();

// Initialize AI client on first request
let clientInitialized = false;

function ensureClientInitialized() {
  if (!clientInitialized) {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.AI_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
    if (!apiKey) {
      throw new AIError('GROQ_API_KEY not configured');
    }
    
    aiClientManager.initialize({ apiKey, model });
    clientInitialized = true;
  }
}

router.post('/generate', async (req: Request, res: Response) => {
  try {
    ensureClientInitialized();
    
    const { description, language = 'typescript' } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Description is required and must be a string'
      });
    }
    
    if (description.length > 5000) {
      return res.status(400).json({
        error: 'Description too long',
        message: 'Description must be less than 5000 characters'
      });
    }
    
    const sanitized = sanitizePrompt(description);
    
    const response = await aiClientManager.executeWithRetry(
      async (client) => await client.chat({
        messages: [
          { 
            role: 'system', 
            content: `You are a code generation assistant. Generate clean, well-documented ${language} code. Include comments explaining key parts.` 
          },
          { role: 'user', content: sanitized }
        ],
        maxTokens: 2000,
        temperature: 0.7
      }),
      'Code generation'
    );
    
    res.json({ 
      code: response.content,
      language,
      usage: response.usage
    });
  } catch (error: any) {
    logger.error('Code generation error', error);
    
    if (error instanceof AIError) {
      return res.status(503).json({ 
        error: 'AI service error',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate code',
      message: 'An internal error occurred'
    });
  }
});

router.post('/explain', async (req: Request, res: Response) => {
  try {
    ensureClientInitialized();
    
    const { code, language } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Code is required and must be a string'
      });
    }
    
    if (code.length > 10000) {
      return res.status(400).json({
        error: 'Code too long',
        message: 'Code must be less than 10000 characters'
      });
    }
    
    const response = await aiClientManager.executeWithRetry(
      async (client) => await client.chat({
        messages: [
          { 
            role: 'system', 
            content: 'You are a code explanation assistant. Explain code clearly and concisely, breaking down complex parts.' 
          },
          { 
            role: 'user', 
            content: `Explain this ${language || 'code'}:\n\n${code}` 
          }
        ],
        maxTokens: 1500,
        temperature: 0.5
      }),
      'Code explanation'
    );
    
    res.json({ 
      explanation: response.content,
      usage: response.usage
    });
  } catch (error: any) {
    logger.error('Code explanation error', error);
    
    if (error instanceof AIError) {
      return res.status(503).json({ 
        error: 'AI service error',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to explain code',
      message: 'An internal error occurred'
    });
  }
});

router.post('/review', async (req: Request, res: Response) => {
  try {
    ensureClientInitialized();
    
    const { code, language } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Code is required and must be a string'
      });
    }
    
    if (code.length > 10000) {
      return res.status(400).json({
        error: 'Code too long',
        message: 'Code must be less than 10000 characters'
      });
    }
    
    const response = await aiClientManager.executeWithRetry(
      async (client) => await client.chat({
        messages: [
          { 
            role: 'system', 
            content: 'You are a code review assistant. Provide constructive feedback on code quality, security, performance, and best practices. Be specific and actionable.' 
          },
          { 
            role: 'user', 
            content: `Review this ${language || 'code'}:\n\n${code}` 
          }
        ],
        maxTokens: 2000,
        temperature: 0.6
      }),
      'Code review'
    );
    
    res.json({ 
      review: response.content,
      usage: response.usage
    });
  } catch (error: any) {
    logger.error('Code review error', error);
    
    if (error instanceof AIError) {
      return res.status(503).json({ 
        error: 'AI service error',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to review code',
      message: 'An internal error occurred'
    });
  }
});

router.post('/refactor', async (req: Request, res: Response) => {
  try {
    ensureClientInitialized();
    
    const { code, language, focus } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Code is required and must be a string'
      });
    }
    
    if (code.length > 10000) {
      return res.status(400).json({
        error: 'Code too long',
        message: 'Code must be less than 10000 characters'
      });
    }
    
    const focusArea = focus || 'readability and maintainability';
    
    const response = await aiClientManager.executeWithRetry(
      async (client) => await client.chat({
        messages: [
          { 
            role: 'system', 
            content: `You are a code refactoring assistant. Refactor code to improve ${focusArea}. Preserve functionality while improving code quality.` 
          },
          { 
            role: 'user', 
            content: `Refactor this ${language || 'code'}:\n\n${code}` 
          }
        ],
        maxTokens: 2000,
        temperature: 0.7
      }),
      'Code refactoring'
    );
    
    res.json({ 
      refactoredCode: response.content,
      focus: focusArea,
      usage: response.usage
    });
  } catch (error: any) {
    logger.error('Code refactoring error', error);
    
    if (error instanceof AIError) {
      return res.status(503).json({ 
        error: 'AI service error',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to refactor code',
      message: 'An internal error occurred'
    });
  }
});

export const codeRouter = router;
