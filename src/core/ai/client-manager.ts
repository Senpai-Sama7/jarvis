/**
 * AI Client Manager
 * Manages AI client lifecycle with connection pooling, health checks, and circuit breaker
 */

import { GroqClient } from './groq-client';
import { logger } from '../utils/logger';
import { AIError } from '../../types';

interface ClientConfig {
  apiKey: string;
  model: string;
  maxRetries?: number;
  retryDelay?: number;
  healthCheckInterval?: number;
}

interface ClientHealth {
  isHealthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  lastError?: Error;
}

export class AIClientManager {
  private static instance: AIClientManager;
  private client: GroqClient | null = null;
  private config: ClientConfig | null = null;
  private health: ClientHealth = {
    isHealthy: true,
    lastCheck: new Date(),
    consecutiveFailures: 0
  };
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private readonly MAX_FAILURES = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private circuitBreakerResetTime: Date | null = null;

  private constructor() {}

  static getInstance(): AIClientManager {
    if (!AIClientManager.instance) {
      AIClientManager.instance = new AIClientManager();
    }
    return AIClientManager.instance;
  }

  initialize(config: ClientConfig): void {
    if (this.client && this.config?.apiKey === config.apiKey && this.config?.model === config.model) {
      return; // Already initialized with same config
    }

    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      healthCheckInterval: 300000, // 5 minutes
      ...config
    };

    this.client = new GroqClient(config.apiKey, config.model);
    this.startHealthChecks();
    logger.info('AI Client Manager initialized', { model: config.model });
  }

  getClient(): GroqClient {
    if (!this.client) {
      throw new AIError('AI Client not initialized. Call initialize() first.');
    }

    if (!this.health.isHealthy) {
      if (this.circuitBreakerResetTime && new Date() > this.circuitBreakerResetTime) {
        logger.info('Circuit breaker reset, attempting recovery');
        this.health.isHealthy = true;
        this.health.consecutiveFailures = 0;
        this.circuitBreakerResetTime = null;
      } else {
        throw new AIError('AI service is currently unavailable (circuit breaker open)');
      }
    }

    return this.client;
  }

  async executeWithRetry<T>(
    operation: (client: GroqClient) => Promise<T>,
    operationName: string = 'AI operation'
  ): Promise<T> {
    const client = this.getClient();
    const maxRetries = this.config?.maxRetries || 3;
    const retryDelay = this.config?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation(client);
        
        // Success - reset failure counter
        if (this.health.consecutiveFailures > 0) {
          this.health.consecutiveFailures = 0;
          this.health.isHealthy = true;
          logger.info('AI service recovered');
        }
        
        return result;
      } catch (error) {
        logger.error(`${operationName} failed (attempt ${attempt}/${maxRetries})`, error);
        
        this.health.consecutiveFailures++;
        this.health.lastError = error as Error;
        
        if (this.health.consecutiveFailures >= this.MAX_FAILURES) {
          this.health.isHealthy = false;
          this.circuitBreakerResetTime = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT);
          logger.error('Circuit breaker opened due to consecutive failures');
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await this.sleep(retryDelay * Math.pow(2, attempt - 1));
      }
    }

    throw new AIError(`${operationName} failed after ${maxRetries} attempts`);
  }

  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    const interval = this.config?.healthCheckInterval || 300000;
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      if (!this.client) return;

      // Simple health check - try a minimal request
      await this.client.chat({
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 5,
        temperature: 0
      });

      this.health.isHealthy = true;
      this.health.lastCheck = new Date();
      this.health.consecutiveFailures = 0;
    } catch (error) {
      logger.warn('Health check failed', error);
      this.health.consecutiveFailures++;
      
      if (this.health.consecutiveFailures >= this.MAX_FAILURES) {
        this.health.isHealthy = false;
      }
    }
  }

  getHealth(): ClientHealth {
    return { ...this.health };
  }

  isHealthy(): boolean {
    return this.health.isHealthy;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    this.client = null;
    this.config = null;
    logger.info('AI Client Manager shut down');
  }
}

export const aiClientManager = AIClientManager.getInstance();
