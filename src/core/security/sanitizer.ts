/**
 * Input Sanitization
 * Prevents command injection and other security vulnerabilities
 */

import { SecurityError } from '../../types';

/**
 * Sanitize shell command arguments
 * Prevents command injection by escaping or removing dangerous characters
 */
export function sanitizeShellArg(arg: string): string {
  if (typeof arg !== 'string') {
    throw new SecurityError('Shell argument must be a string');
  }
  
  // Remove null bytes
  arg = arg.replace(/\0/g, '');
  
  // Escape special shell characters
  // Using single quotes and escaping any single quotes in the string
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Validate that a string contains only safe characters
 */
export function validateSafeString(input: string, allowedPattern: RegExp): boolean {
  return allowedPattern.test(input);
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(filePath: string): string {
  if (typeof filePath !== 'string') {
    throw new SecurityError('File path must be a string');
  }
  
  // Remove null bytes
  filePath = filePath.replace(/\0/g, '');
  
  // Remove .. to prevent directory traversal
  filePath = filePath.replace(/\.\./g, '');
  
  // Remove leading slashes to prevent absolute path access
  filePath = filePath.replace(/^\/+/, '');
  
  return filePath;
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  if (key.length < 16) return false;
  if (key.length > 512) return false;
  
  // Should contain only alphanumeric and common special chars
  return /^[a-zA-Z0-9_\-\.]+$/.test(key);
}

/**
 * Sanitize user input for AI prompts
 * Removes potentially harmful patterns
 */
export function sanitizePrompt(prompt: string): string {
  if (typeof prompt !== 'string') {
    throw new SecurityError('Prompt must be a string');
  }
  
  // Remove null bytes
  prompt = prompt.replace(/\0/g, '');
  
  // Limit length to prevent resource exhaustion
  const MAX_PROMPT_LENGTH = 50000;
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.substring(0, MAX_PROMPT_LENGTH);
  }
  
  return prompt.trim();
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    throw new SecurityError('File name must be a string');
  }
  
  // Remove null bytes
  fileName = fileName.replace(/\0/g, '');
  
  // Remove path separators
  fileName = fileName.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  fileName = fileName.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  const MAX_FILENAME_LENGTH = 255;
  if (fileName.length > MAX_FILENAME_LENGTH) {
    fileName = fileName.substring(0, MAX_FILENAME_LENGTH);
  }
  
  return fileName;
}

/**
 * Check if a command is in a whitelist
 */
export function isWhitelistedCommand(command: string, whitelist: string[]): boolean {
  const baseCommand = command.split(' ')[0];
  return whitelist.includes(baseCommand);
}

/**
 * Sanitize environment variable name
 */
export function sanitizeEnvVarName(name: string): string {
  if (typeof name !== 'string') {
    throw new SecurityError('Environment variable name must be a string');
  }
  
  // Only allow alphanumeric and underscore
  if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
    throw new SecurityError('Invalid environment variable name');
  }
  
  return name;
}
