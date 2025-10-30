/**
 * Unit tests for helper utilities
 */

import {
  truncate,
  safeJsonParse,
  delay,
} from '../../../src/core/utils/helpers';

describe('helpers', () => {
  describe('delay', () => {
    it('should delay for specified milliseconds', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'a'.repeat(100);
      const result = truncate(longString, 10);
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result).toContain('...');
    });

    it('should not truncate short strings', () => {
      const shortString = 'hello';
      const result = truncate(shortString, 10);
      expect(result).toBe(shortString);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"key": "value"}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const json = 'invalid json';
      const fallback = { default: true };
      const result = safeJsonParse(json, fallback);
      expect(result).toBe(fallback);
    });
  });
});
