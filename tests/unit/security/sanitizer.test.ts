/**
 * Unit tests for sanitizer module
 */

import {
  sanitizeShellArg,
  sanitizeFilePath,
  sanitizePrompt,
  sanitizeFileName,
  validateApiKey,
} from '../../../src/core/security/sanitizer';
import { SecurityError } from '../../../src/types';

describe('sanitizer', () => {
  describe('sanitizeShellArg', () => {
    it('should escape single quotes', () => {
      const input = "hello'world";
      const result = sanitizeShellArg(input);
      expect(result).toBe("'hello'\\''world'");
    });

    it('should remove null bytes', () => {
      const input = 'hello\0world';
      const result = sanitizeShellArg(input);
      expect(result).not.toContain('\0');
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizeShellArg(123 as any)).toThrow(SecurityError);
    });
  });

  describe('sanitizeFilePath', () => {
    it('should remove directory traversal attempts', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilePath(input);
      expect(result).not.toContain('..');
    });

    it('should remove leading slashes', () => {
      const input = '/etc/passwd';
      const result = sanitizeFilePath(input);
      expect(result).not.toMatch(/^\//);
    });

    it('should remove null bytes', () => {
      const input = 'file\0name.txt';
      const result = sanitizeFilePath(input);
      expect(result).not.toContain('\0');
    });
  });

  describe('sanitizePrompt', () => {
    it('should remove null bytes', () => {
      const input = 'hello\0world';
      const result = sanitizePrompt(input);
      expect(result).not.toContain('\0');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizePrompt(input);
      expect(result).toBe('hello world');
    });

    it('should limit length', () => {
      const input = 'a'.repeat(100000);
      const result = sanitizePrompt(input);
      expect(result.length).toBeLessThanOrEqual(50000);
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizePrompt(123 as any)).toThrow(SecurityError);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path separators', () => {
      const input = 'path/to/file.txt';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
    });

    it('should remove dangerous characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = sanitizeFileName(input);
      expect(result).toBe('file.txt');
    });

    it('should limit length', () => {
      const input = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(input);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('validateApiKey', () => {
    it('should accept valid API keys', () => {
      const validKey = 'sk_1234567890abcdef1234567890abcdef';
      expect(validateApiKey(validKey)).toBe(true);
    });

    it('should reject short keys', () => {
      const shortKey = 'short';
      expect(validateApiKey(shortKey)).toBe(false);
    });

    it('should reject keys with invalid characters', () => {
      const invalidKey = 'sk_1234567890@#$%^&*()';
      expect(validateApiKey(invalidKey)).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(validateApiKey(123 as any)).toBe(false);
    });
  });
});
