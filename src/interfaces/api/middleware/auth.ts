import { Request, Response, NextFunction } from 'express';
import { SecurityError } from '../../../types';
import { logger } from '../../../core/utils/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['authorization']?.replace('Bearer ', '');
  const expectedKey = process.env.API_KEY;
  
  if (!expectedKey) {
    logger.warn('API_KEY not configured, authentication disabled');
    return next();
  }
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (apiKey !== expectedKey) {
    logger.warn(`Invalid API key attempt from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
}
