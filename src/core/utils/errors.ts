import { Logger } from '../../types';

export function handleError(error: any, logger: Logger): void {
  if (error.name === 'JarvisError' || error.name === 'ConfigurationError' || 
      error.name === 'SecurityError' || error.name === 'AIError') {
    logger.error(`${error.name}: ${error.message}`, error.details);
  } else {
    logger.error('Unexpected error:', error);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
}
