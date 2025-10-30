import { Request, Response, NextFunction } from 'express';
import { extractBearerToken, validateApiKeyAuth } from '../../../core/security/auth';
import { logger } from '../../../core/utils/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.API_KEY;
  
  if (!expectedKey) {
    logger.warn('API_KEY not configured, authentication disabled');
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  const apiKey = extractBearerToken(authHeader);
  
  if (!apiKey) {
    logger.warn('Missing authentication token', { ip: req.ip, path: req.path });
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide a valid Bearer token'
    });
  }
  
  try {
    if (!validateApiKeyAuth(apiKey, expectedKey)) {
      logger.warn('Invalid API key attempt', { 
        ip: req.ip, 
        path: req.path,
        keyPrefix: apiKey.substring(0, 8)
      });
      return res.status(403).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }
  } catch (error) {
    logger.error('Auth validation error', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
  
  next();
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.API_KEY;
  
  if (!expectedKey) {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }
  
  const apiKey = extractBearerToken(authHeader);
  if (apiKey && validateApiKeyAuth(apiKey, expectedKey)) {
    (req as any).authenticated = true;
  }
  
  next();
}
