import { Router, Request, Response } from 'express';
import { createGroqClient } from '../../../core/ai/groq-client';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const model = process.env.AI_MODEL || process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    const client = createGroqClient(process.env.GROQ_API_KEY || '', model);
    
    const sanitized = sanitizePrompt(message);
    const response = await client.chat({
      messages: [
        { role: 'system', content: 'You are JARVIS, a helpful AI assistant.' },
        { role: 'user', content: sanitized }
      ]
    });
    
    res.json({ response: response.content, conversationId });
  } catch (error: any) {
    logger.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export const chatRouter = router;
