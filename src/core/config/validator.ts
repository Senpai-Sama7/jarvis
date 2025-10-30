/**
 * Configuration Validator
 * Validates configuration objects
 */

import { JarvisConfig, ValidationResult } from '../../types';

/**
 * Validate AI configuration
 */
function validateAIConfig(config: JarvisConfig['ai']): string[] {
  const errors: string[] = [];
  
  if (!['groq', 'anthropic', 'openai'].includes(config.provider)) {
    errors.push('AI provider must be one of: groq, anthropic, openai');
  }
  
  if (!config.model || config.model.trim() === '') {
    errors.push('AI model is required');
  }
  
  if (config.maxTokens !== undefined) {
    if (config.maxTokens < 1 || config.maxTokens > 100000) {
      errors.push('Max tokens must be between 1 and 100000');
    }
  }
  
  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
  }
  
  return errors;
}

/**
 * Validate voice configuration
 */
function validateVoiceConfig(config: JarvisConfig['voice']): string[] {
  const errors: string[] = [];
  
  if (config.input.silenceDuration < 0 || config.input.silenceDuration > 10) {
    errors.push('Silence duration must be between 0 and 10 seconds');
  }
  
  if (!['festival', 'espeak', 'say'].includes(config.output.engine)) {
    errors.push('Voice output engine must be one of: festival, espeak, say');
  }
  
  return errors;
}

/**
 * Validate security configuration
 */
function validateSecurityConfig(config: JarvisConfig['security']): string[] {
  const errors: string[] = [];
  
  if (config.authentication.enabled) {
    if (!['jwt', 'apikey', 'oauth'].includes(config.authentication.method)) {
      errors.push('Auth method must be one of: jwt, apikey, oauth');
    }
  }
  
  if (config.rateLimiting.enabled) {
    if (config.rateLimiting.maxRequests < 1) {
      errors.push('Max requests must be at least 1');
    }
    if (config.rateLimiting.windowMs < 1000) {
      errors.push('Rate limit window must be at least 1000ms');
    }
  }
  
  return errors;
}

/**
 * Validate interfaces configuration
 */
function validateInterfacesConfig(config: JarvisConfig['interfaces']): string[] {
  const errors: string[] = [];
  
  if (config.web.enabled) {
    if (config.web.port < 1 || config.web.port > 65535) {
      errors.push('Web port must be between 1 and 65535');
    }
  }
  
  if (config.api.enabled) {
    if (config.api.port < 1 || config.api.port > 65535) {
      errors.push('API port must be between 1 and 65535');
    }
  }
  
  if (config.web.enabled && config.api.enabled && config.web.port === config.api.port) {
    errors.push('Web and API ports must be different');
  }
  
  return errors;
}

/**
 * Validate complete configuration
 */
export function validateConfig(config: JarvisConfig): ValidationResult {
  const errors: string[] = [];
  
  errors.push(...validateAIConfig(config.ai));
  errors.push(...validateVoiceConfig(config.voice));
  errors.push(...validateSecurityConfig(config.security));
  errors.push(...validateInterfacesConfig(config.interfaces));
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if configuration is complete
 */
export function isConfigComplete(config: JarvisConfig): boolean {
  // Check if required fields are present
  return !!(
    config.ai &&
    config.ai.provider &&
    config.ai.model &&
    config.voice &&
    config.security &&
    config.interfaces
  );
}
