/**
 * Authentication
 * Handles user authentication for remote access
 */

import crypto from 'crypto';
import { SecurityError } from '../../types';

export interface AuthToken {
  token: string;
  expiresAt: Date;
  userId?: string;
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, actualSalt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve({
        hash: derivedKey.toString('hex'),
        salt: actualSalt
      });
    });
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}

/**
 * Create a JWT-like token (simple version)
 * For production, use a proper JWT library
 */
export function createAuthToken(userId: string, expiresInSeconds: number = 3600): AuthToken {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  return {
    token,
    expiresAt,
    userId
  };
}

/**
 * Validate an auth token
 */
export function validateAuthToken(token: AuthToken): boolean {
  return new Date() < token.expiresAt;
}

/**
 * Simple API key validation
 */
export function validateApiKeyAuth(providedKey: string, expectedKey: string): boolean {
  if (!providedKey || !expectedKey) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedKey),
    Buffer.from(expectedKey)
  );
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
