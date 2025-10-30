import { Router, Request, Response } from 'express';
import { aiClientManager } from '../../../core/ai/client-manager';
import { conversationManager } from '../../../core/ai/conversation-manager';
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
    logger.info('AI client initialized for chat route');
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    ensureClientInitialized();
    
    const { message, conversationId, stream = false } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Message is required and must be a string'
      });
    }
    
    if (message.length > 10000) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Message must be less than 10000 characters'
      });
    }
    
    const sanitized = sanitizePrompt(message);
    
    // Get or create conversation
    let convId = conversationId;
    if (!convId || !conversationManager.getConversation(convId)) {
      convId = conversationManager.createConversation(
        'You are JARVIS, a helpful AI assistant. Be concise and accurate.'
      );
    }
    
    // Add user message to conversation
    conversationManager.addMessage(convId, 'user', sanitized);
    
    // Get conversation history
    const messages = conversationManager.getMessages(convId);
    
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        const client = aiClientManager.getClient();
        let fullResponse = '';
        
        for await (const chunk of client.streamChat({ messages })) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }
        
        // Add assistant response to conversation
        conversationManager.addMessage(convId, 'assistant', fullResponse);
        
        res.write(`data: ${JSON.stringify({ 
          chunk: '', 
          done: true, 
          conversationId: convId 
        })}\n\n`);
        res.end();
      } catch (error) {
        logger.error('Streaming error', error);
        res.write(`data: ${JSON.stringify({ 
          error: 'Streaming failed',
          done: true 
        })}\n\n`);
        res.end();
      }
    } else {
      // Regular response
      const response = await aiClientManager.executeWithRetry(
        async (client) => await client.chat({ messages }),
        'Chat completion'
      );
      
      // Add assistant response to conversation
      conversationManager.addMessage(convId, 'assistant', response.content);
      
      res.json({ 
        response: response.content, 
        conversationId: convId,
        usage: response.usage,
        model: response.model
      });
    }
  } catch (error: any) {
    logger.error('Chat error', error);
    
    if (error instanceof AIError) {
      return res.status(503).json({ 
        error: 'AI service error',
        message: error.message,
        retryable: true
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process chat request'
    });
  }
});

// Get conversation history
router.get('/conversation/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = conversationManager.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ 
        error: 'Conversation not found',
        message: `No conversation found with ID: ${id}`
      });
    }
    
    res.json({ conversation });
  } catch (error) {
    logger.error('Get conversation error', error);
    res.status(500).json({ 
      error: 'Failed to retrieve conversation'
    });
  }
});

// Delete conversation
router.delete('/conversation/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = conversationManager.deleteConversation(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Conversation not found'
      });
    }
    
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    logger.error('Delete conversation error', error);
    res.status(500).json({ 
      error: 'Failed to delete conversation'
    });
  }
});

// Health check for AI service
router.get('/health', async (req: Request, res: Response) => {
  try {
    ensureClientInitialized();
    
    const health = aiClientManager.getHealth();
    const convStats = conversationManager.getStats();
    
    res.json({
      ai: {
        healthy: health.isHealthy,
        lastCheck: health.lastCheck,
        consecutiveFailures: health.consecutiveFailures
      },
      conversations: convStats
    });
  } catch (error) {
    logger.error('Health check error', error);
    res.status(503).json({ 
      error: 'Service unavailable',
      healthy: false
    });
  }
});

export const chatRouter = router;
