import { Router, Request, Response } from 'express';
import { createGroqClient } from '../../../core/ai/groq-client';
import { loadConfig } from '../../../core/config';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';

const router = Router();
const config = loadConfig();
const client = createGroqClient(process.env.GROQ_API_KEY || '', config.ai.model);

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { description, language = 'typescript' } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const sanitized = sanitizePrompt(description);
    const response = await client.chat({
      messages: [
        { role: 'system', content: `You are a code generation assistant. Generate ${language} code only.` },
        { role: 'user', content: sanitized }
      ]
    });
    
    res.json({ code: response.content });
  } catch (error: any) {
    logger.error('Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const response = await client.chat({
      messages: [
        { role: 'system', content: 'You are a code explanation assistant.' },
        { role: 'user', content: `Explain this ${language || ''} code:\n\n${code}` }
      ]
    });
    
    res.json({ explanation: response.content });
  } catch (error: any) {
    logger.error('Code explanation error:', error);
    res.status(500).json({ error: 'Failed to explain code' });
  }
});

router.post('/review', async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const response = await client.chat({
      messages: [
        { role: 'system', content: 'You are a code review assistant. Provide constructive feedback.' },
        { role: 'user', content: `Review this ${language || ''} code:\n\n${code}` }
      ]
    });
    
    res.json({ review: response.content });
  } catch (error: any) {
    logger.error('Code review error:', error);
    res.status(500).json({ error: 'Failed to review code' });
  }
});

export const codeRouter = router;
