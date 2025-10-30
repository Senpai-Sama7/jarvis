/**
 * Unit tests for configuration module
 */

import { validateConfig, isConfigComplete } from '../../../src/core/config/validator';
import { JarvisConfig } from '../../../src/types';

describe('config validator', () => {
  const validConfig: JarvisConfig = {
    ai: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      maxTokens: 8000,
      temperature: 0.7,
    },
    voice: {
      input: {
        enabled: true,
        model: 'whisper-large-v3',
        silenceDuration: 2,
        silenceThreshold: '5%',
      },
      output: {
        enabled: true,
        engine: 'festival',
      },
    },
    security: {
      authentication: {
        enabled: false,
        method: 'apikey',
      },
      rateLimiting: {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000,
      },
      inputSanitization: {
        enabled: true,
      },
    },
    interfaces: {
      cli: { enabled: true },
      tui: { enabled: true },
      gui: { enabled: true },
      web: { enabled: true, port: 3000 },
      api: { enabled: true, port: 8080 },
    },
  };

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      const result = validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid AI provider', () => {
      const invalidConfig = {
        ...validConfig,
        ai: { ...validConfig.ai, provider: 'invalid' as any },
      };
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid temperature', () => {
      const invalidConfig = {
        ...validConfig,
        ai: { ...validConfig.ai, temperature: 3 },
      };
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid port numbers', () => {
      const invalidConfig = {
        ...validConfig,
        interfaces: {
          ...validConfig.interfaces,
          web: { enabled: true, port: 99999 },
        },
      };
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
    });

    it('should reject duplicate ports', () => {
      const invalidConfig = {
        ...validConfig,
        interfaces: {
          ...validConfig.interfaces,
          web: { enabled: true, port: 8080 },
          api: { enabled: true, port: 8080 },
        },
      };
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
    });
  });

  describe('isConfigComplete', () => {
    it('should return true for complete configuration', () => {
      expect(isConfigComplete(validConfig)).toBe(true);
    });

    it('should return false for incomplete configuration', () => {
      const incompleteConfig = {
        ...validConfig,
        ai: { ...validConfig.ai, model: undefined as any },
      };
      expect(isConfigComplete(incompleteConfig)).toBe(false);
    });
  });
});
