import { JarvisConfig, ValidationResult } from '../../types';

export function validateConfig(config: JarvisConfig): ValidationResult {
  const errors: string[] = [];

  // Validate AI config
  if (!config.ai.provider) {
    errors.push('AI provider is required');
  }
  if (!config.ai.model) {
    errors.push('AI model is required');
  }

  // Validate interfaces
  if (config.interfaces.web.enabled && !config.interfaces.web.port) {
    errors.push('Web port is required when web interface is enabled');
  }
  if (config.interfaces.api.enabled && !config.interfaces.api.port) {
    errors.push('API port is required when API interface is enabled');
  }

  // Validate security
  if (config.security.rateLimiting.enabled) {
    if (config.security.rateLimiting.maxRequests <= 0) {
      errors.push('Rate limit maxRequests must be positive');
    }
    if (config.security.rateLimiting.windowMs <= 0) {
      errors.push('Rate limit windowMs must be positive');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
