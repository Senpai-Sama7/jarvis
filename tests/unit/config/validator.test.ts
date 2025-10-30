/**
 * Unit tests for configuration module
 */

import { validateConfig } from '../../../src/core/config/validator';
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
    it('should validate a valid config', () => {
      const result = validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config without AI provider', () => {
      const invalidConfig = { ...validConfig, ai: { ...validConfig.ai, provider: '' } };
      const result = validateConfig(invalidConfig as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('AI provider is required');
    });

    it('should reject config without AI model', () => {
      const invalidConfig = { ...validConfig, ai: { ...validConfig.ai, model: '' } };
      const result = validateConfig(invalidConfig as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('AI model is required');
    });

    it('should reject config with invalid rate limit', () => {
      const invalidConfig = {
        ...validConfig,
        security: {
          ...validConfig.security,
          rateLimiting: {
            enabled: true,
            maxRequests: -1,
            windowMs: 60000,
          },
        },
      };
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rate limit maxRequests must be positive');
    });
  });
});
