/**
 * Error Handling Utilities
 */

import { JarvisError, ConfigurationError, SecurityError, AIError } from '../../types';

export { JarvisError, ConfigurationError, SecurityError, AIError };

/**
 * Handles errors consistently across the application
 */
export function handleError(error: unknown, logger?: any): never {
  if (error instanceof JarvisError) {
    if (logger) {
      logger.error(`${error.name}: ${error.message}`, error.details);
    } else {
      console.error(`${error.name}: ${error.message}`, error.details);
    }
    process.exit(1);
  }
  
  if (error instanceof Error) {
    if (logger) {
      logger.error(`Unexpected error: ${error.message}`, error.stack);
    } else {
      console.error(`Unexpected error: ${error.message}`, error.stack);
    }
    process.exit(1);
  }
  
  if (logger) {
    logger.error('Unknown error occurred', error);
  } else {
    console.error('Unknown error occurred', error);
  }
  process.exit(1);
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  logger?: any
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, logger);
    }
  }) as T;
}
