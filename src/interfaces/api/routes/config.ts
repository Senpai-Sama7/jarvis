/**
 * Config API Routes
 */

import { Router, Request, Response } from 'express';
import { loadConfig, getDefaultConfig } from '../../../core/config';
import { logger } from '../../../core/utils/logger';

export const configRouter = Router();

/**
 * GET /api/config
 * Get current configuration (excluding sensitive data)
 */
configRouter.get('/', (req: Request, res: Response) => {
  try {
    const config = loadConfig();
    
    // Remove sensitive data
    const safeConfig = {
      ai: {
        provider: config.ai.provider,
        model: config.ai.model,
        maxTokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
      },
      voice: config.voice,
      interfaces: config.interfaces,
    };
    
    res.json(safeConfig);
    
  } catch (error) {
    logger.error('Config error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to load configuration',
    });
  }
});

/**
 * GET /api/config/defaults
 * Get default configuration
 */
configRouter.get('/defaults', (req: Request, res: Response) => {
  try {
    const defaultConfig = getDefaultConfig();
    
    // Remove sensitive data
    const safeConfig = {
      ai: {
        provider: defaultConfig.ai.provider,
        model: defaultConfig.ai.model,
        maxTokens: defaultConfig.ai.maxTokens,
        temperature: defaultConfig.ai.temperature,
      },
      voice: defaultConfig.voice,
      interfaces: defaultConfig.interfaces,
    };
    
    res.json(safeConfig);
    
  } catch (error) {
    logger.error('Config error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to load default configuration',
    });
  }
});
