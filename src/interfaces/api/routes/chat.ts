/**
 * Chat API Routes
 */

import { Router, Request, Response } from 'express';
import { loadConfig } from '../../../core/config';
import { validateSecrets } from '../../../core/security/secrets';
import { createGroqClient } from '../../../core/ai/groq-client';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';
import { Message } from '../../../types';

export const chatRouter = Router();

// Store conversation sessions in memory (for demo purposes)
// In production, use a database or Redis
const conversations = new Map<string, Message[]>();

/**
 * POST /api/chat
 * Send a message and get a response
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId, stream = false } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required and must be a string',
      });
    }
    
    // Load configuration
    const config = loadConfig();
    validateSecrets(config.ai.provider);
    
    // Get or create conversation
    const convId = conversationId || `conv_${Date.now()}`;
    let history = conversations.get(convId);
    
    if (!history) {
      history = [
        {
          role: 'system',
          content: 'You are JARVIS, an advanced AI coding assistant. You help with code generation, explanation, refactoring, debugging, and general programming questions.',
        },
      ];
      conversations.set(convId, history);
    }
    
    // Sanitize and add user message
    const sanitizedMessage = sanitizePrompt(message);
    history.push({
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date(),
    });
    
    // Get AI response
    const apiKey = process.env.GROQ_API_KEY || '';
    const client = createGroqClient(apiKey, config.ai.model);
    
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      let fullResponse = '';
      
      for await (const chunk of client.streamChat({
        messages: history,
        temperature: config.ai.temperature,
        maxTokens: config.ai.maxTokens,
      })) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      
      // Add assistant response to history
      history.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      });
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else {
      // Non-streaming response
      const response = await client.chat({
        messages: history,
        temperature: config.ai.temperature,
        maxTokens: config.ai.maxTokens,
      });
      
      // Add assistant response to history
      history.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      });
      
      // Trim history if too long
      if (history.length > 20) {
        history.splice(1, 2); // Remove oldest user-assistant pair
      }
      
      res.json({
        conversationId: convId,
        message: response.content,
        usage: response.usage,
      });
    }
    
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process chat request',
    });
  }
});

/**
 * GET /api/chat/:conversationId
 * Get conversation history
 */
chatRouter.get('/:conversationId', (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const history = conversations.get(conversationId);
  
  if (!history) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
    });
  }
  
  res.json({
    conversationId,
    messages: history.filter(m => m.role !== 'system'),
  });
});

/**
 * DELETE /api/chat/:conversationId
 * Clear conversation history
 */
chatRouter.delete('/:conversationId', (req: Request, res: Response) => {
  const { conversationId } = req.params;
  conversations.delete(conversationId);
  
  res.json({
    message: 'Conversation cleared',
  });
});
