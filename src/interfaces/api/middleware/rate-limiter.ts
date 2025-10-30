/**
 * Rate Limiter Middleware
 * Implements sliding window rate limiting with per-user tracking
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../core/utils/logger';

interface RateLimitEntry {
  requests: number[];
  blocked: boolean;
  blockedUntil?: Date;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly blockDuration: number;

  constructor(
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 60,
    blockDuration: number = 300000 // 5 minutes
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.blockDuration = blockDuration;
    this.startCleanup();
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = this.getIdentifier(req);
      const now = Date.now();

      let entry = this.limits.get(identifier);
      if (!entry) {
        entry = { requests: [], blocked: false };
        this.limits.set(identifier, entry);
      }

      // Check if blocked
      if (entry.blocked && entry.blockedUntil) {
        if (now < entry.blockedUntil.getTime()) {
          const retryAfter = Math.ceil((entry.blockedUntil.getTime() - now) / 1000);
          res.set('Retry-After', retryAfter.toString());
          return res.status(429).json({
            error: 'Too many requests',
            retryAfter
          });
        } else {
          // Unblock
          entry.blocked = false;
          entry.blockedUntil = undefined;
          entry.requests = [];
        }
      }

      // Remove old requests outside window
      entry.requests = entry.requests.filter(time => now - time < this.windowMs);

      // Check limit
      if (entry.requests.length >= this.maxRequests) {
        entry.blocked = true;
        entry.blockedUntil = new Date(now + this.blockDuration);
        
        logger.warn('Rate limit exceeded', { 
          identifier, 
          requests: entry.requests.length,
          blockedUntil: entry.blockedUntil 
        });

        const retryAfter = Math.ceil(this.blockDuration / 1000);
        res.set('Retry-After', retryAfter.toString());
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter
        });
      }

      // Add current request
      entry.requests.push(now);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.maxRequests - entry.requests.length).toString(),
        'X-RateLimit-Reset': new Date(now + this.windowMs).toISOString()
      });

      next();
    };
  }

  private getIdentifier(req: Request): string {
    // Try to get user ID from auth, fallback to IP
    const userId = (req as any).userId;
    if (userId) return `user:${userId}`;

    const ip = req.ip || 
                req.headers['x-forwarded-for'] || 
                req.headers['x-real-ip'] || 
                req.socket.remoteAddress;
    
    return `ip:${ip}`;
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [identifier, entry] of this.limits.entries()) {
        // Remove entries with no recent requests
        entry.requests = entry.requests.filter(time => now - time < this.windowMs);
        
        if (entry.requests.length === 0 && !entry.blocked) {
          this.limits.delete(identifier);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug('Cleaned up rate limit entries', { count: cleaned });
      }
    }, this.windowMs);
  }

  getStats() {
    return {
      totalTracked: this.limits.size,
      blocked: Array.from(this.limits.values()).filter(e => e.blocked).length
    };
  }
}

export const rateLimiter = new RateLimiter();
