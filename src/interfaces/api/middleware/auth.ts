/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { extractBearerToken, validateApiKeyAuth } from '../../../core/security/auth';
import { logger } from '../../../core/utils/logger';

/**
 * Authentication middleware
 * Validates API keys or JWT tokens
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get API key from environment
    const expectedApiKey = process.env.API_KEY;
    
    if (!expectedApiKey) {
      logger.warn('API_KEY not configured, skipping authentication');
      return next();
    }
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header is required',
      });
      return;
    }
    
    // Validate API key
    if (!validateApiKeyAuth(token, expectedApiKey)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }
    
    // Authentication successful
    next();
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}
