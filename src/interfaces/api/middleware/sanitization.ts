/**
 * Input Sanitization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';

/**
 * Sanitizes all string inputs in request body
 */
export function sanitizationMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization middleware error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid input',
    });
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic sanitization
      obj[key] = obj[key].replace(/\0/g, ''); // Remove null bytes
      
      // Limit string length
      if (obj[key].length > 100000) {
        obj[key] = obj[key].substring(0, 100000);
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
