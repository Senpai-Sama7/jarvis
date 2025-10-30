/**
 * Secrets Management
 * Secure handling of API keys and sensitive data
 */

import { ConfigurationError } from '../../types';
import { getEnv } from '../utils/helpers';

export interface Secrets {
  groqApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

/**
 * Load secrets from environment variables
 * Never loads from files or hardcoded values
 */
export function loadSecrets(): Secrets {
  const secrets: Secrets = {};
  
  // Load Groq API key
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    secrets.groqApiKey = groqKey;
  }
  
  // Load Anthropic API key
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    secrets.anthropicApiKey = anthropicKey;
  }
  
  // Load OpenAI API key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    secrets.openaiApiKey = openaiKey;
  }
  
  return secrets;
}

/**
 * Validate that required secrets are present
 */
export function validateSecrets(provider: 'groq' | 'anthropic' | 'openai'): void {
  const secrets = loadSecrets();
  
  switch (provider) {
    case 'groq':
      if (!secrets.groqApiKey) {
        throw new ConfigurationError(
          'GROQ_API_KEY environment variable is required. ' +
          'Get your API key from https://console.groq.com/keys'
        );
      }
      break;
    case 'anthropic':
      if (!secrets.anthropicApiKey) {
        throw new ConfigurationError(
          'ANTHROPIC_API_KEY environment variable is required'
        );
      }
      break;
    case 'openai':
      if (!secrets.openaiApiKey) {
        throw new ConfigurationError(
          'OPENAI_API_KEY environment variable is required'
        );
      }
      break;
  }
}

/**
 * Mask sensitive data for logging
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) {
    return '***';
  }
  
  return secret.substring(0, 4) + '...' + secret.substring(secret.length - 4);
}

/**
 * Check if a string looks like an API key (for leak detection)
 */
export function looksLikeApiKey(str: string): boolean {
  // Check for common API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9]{32,}$/, // OpenAI style
    /^gsk_[a-zA-Z0-9]{32,}$/, // Groq style
    /^[a-zA-Z0-9_\-]{32,}$/, // Generic long alphanumeric
  ];
  
  return patterns.some(pattern => pattern.test(str));
}
