import { Router, Request, Response } from 'express';
import { createGroqClient } from '../../../core/ai/groq-client';
import { loadConfig } from '../../../core/config';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';

const router = Router();
const config = loadConfig();
const client = createGroqClient(process.env.GROQ_API_KEY || '', config.ai.model);

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
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
