/**
 * Conversation Manager
 * Manages conversation context with token limits and memory optimization
 */

import { logger } from '../utils/logger';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  tokens?: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private readonly MAX_CONTEXT_TOKENS = 8000;
  private readonly SYSTEM_MESSAGE_TOKENS = 50; // Approximate
  private readonly MAX_CONVERSATIONS = 100;
  private readonly CONVERSATION_TTL = 3600000; // 1 hour

  constructor() {
    this.startCleanupTimer();
  }

  createConversation(systemPrompt?: string): string {
    const id = this.generateId();
    const conversation: Conversation = {
      id,
      messages: systemPrompt ? [{
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
        tokens: this.estimateTokens(systemPrompt)
      }] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.conversations.set(id, conversation);
    this.enforceMaxConversations();
    
    logger.debug('Conversation created', { id });
    return id;
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message: Message = {
      role,
      content,
      timestamp: new Date(),
      tokens: this.estimateTokens(content)
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Trim context if needed
    this.trimContext(conversation);
  }

  getMessages(conversationId: string): Message[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return [...conversation.messages];
  }

  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  clearAll(): void {
    this.conversations.clear();
    logger.info('All conversations cleared');
  }

  private trimContext(conversation: Conversation): void {
    let totalTokens = 0;
    const systemMessages: Message[] = [];
    const otherMessages: Message[] = [];

    // Separate system messages (always keep)
    for (const msg of conversation.messages) {
      if (msg.role === 'system') {
        systemMessages.push(msg);
        totalTokens += msg.tokens || this.SYSTEM_MESSAGE_TOKENS;
      } else {
        otherMessages.push(msg);
      }
    }

    // Calculate tokens for other messages
    for (const msg of otherMessages) {
      totalTokens += msg.tokens || this.estimateTokens(msg.content);
    }

    // Trim oldest messages if over limit
    while (totalTokens > this.MAX_CONTEXT_TOKENS && otherMessages.length > 2) {
      const removed = otherMessages.shift();
      if (removed) {
        totalTokens -= removed.tokens || this.estimateTokens(removed.content);
        logger.debug('Trimmed message from context', { 
          conversationId: conversation.id,
          remainingMessages: otherMessages.length 
        });
      }
    }

    conversation.messages = [...systemMessages, ...otherMessages];
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private enforceMaxConversations(): void {
    if (this.conversations.size <= this.MAX_CONVERSATIONS) {
      return;
    }

    // Remove oldest conversations
    const sorted = Array.from(this.conversations.entries())
      .sort((a, b) => a[1].updatedAt.getTime() - b[1].updatedAt.getTime());

    const toRemove = sorted.slice(0, sorted.length - this.MAX_CONVERSATIONS);
    for (const [id] of toRemove) {
      this.conversations.delete(id);
      logger.debug('Removed old conversation', { id });
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 300000); // Every 5 minutes
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [id, conversation] of this.conversations.entries()) {
      if (now - conversation.updatedAt.getTime() > this.CONVERSATION_TTL) {
        this.conversations.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info('Cleaned up expired conversations', { count: removed });
    }
  }

  getStats() {
    return {
      totalConversations: this.conversations.size,
      maxConversations: this.MAX_CONVERSATIONS,
      maxContextTokens: this.MAX_CONTEXT_TOKENS
    };
  }
}

export const conversationManager = new ConversationManager();
