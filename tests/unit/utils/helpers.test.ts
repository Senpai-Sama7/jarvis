/**
 * Unit tests for helper utilities
 */

import {
  sleep,
  retry,
  formatBytes,
  formatDuration,
  truncate,
  deepClone,
  getEnv,
  safeJsonParse,
} from '../../../src/core/utils/helpers';

describe('helpers', () => {
  describe('sleep', () => {
    it('should sleep for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const result = await retry(fn, { maxAttempts: 3, delayMs: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      
      await expect(retry(fn, { maxAttempts: 2, delayMs: 10 })).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(3600000)).toBe('1h 0m 0s');
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

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
  });

  describe('getEnv', () => {
    it('should get environment variable', () => {
      process.env.TEST_VAR = 'test_value';
      expect(getEnv('TEST_VAR')).toBe('test_value');
      delete process.env.TEST_VAR;
    });

    it('should use fallback if variable not set', () => {
      expect(getEnv('NON_EXISTENT_VAR', 'fallback')).toBe('fallback');
    });

    it('should throw if variable not set and no fallback', () => {
      expect(() => getEnv('NON_EXISTENT_VAR')).toThrow();
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
