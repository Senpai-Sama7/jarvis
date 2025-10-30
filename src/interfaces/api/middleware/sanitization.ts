import { Request, Response, NextFunction } from 'express';
import { sanitizePrompt } from '../../../core/security/sanitizer';

export function sanitizationMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizePrompt(req.body[key]);
      }
    }
  }
  next();
}
