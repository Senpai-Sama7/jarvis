/**
 * JARVIS HTTP API
 * RESTful API for programmatic access to JARVIS features
 */

import express, { Request, Response, NextFunction } from 'express';
import { loadConfig } from '../../core/config';
import { logger } from '../../core/utils/logger';
import { handleError } from '../../core/utils/errors';
import { chatRouter } from './routes/chat';
import { codeRouter } from './routes/code';
import { configRouter } from './routes/config';
import { executeRouter } from './routes/execute';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { sanitizationMiddleware } from './middleware/sanitization';
import { rateLimiter } from './middleware/rate-limiter';
import { aiClientManager } from '../../core/ai/client-manager';

const app = express();

// Load configuration
const config = loadConfig();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS with proper configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Rate limiting
if (config.security.rateLimiting.enabled) {
  app.use('/api/', rateLimiter.middleware());
}

// Input sanitization
if (config.security.inputSanitization.enabled) {
  app.use('/api/', sanitizationMiddleware);
}

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Root endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({
    name: 'JARVIS API',
    version: '2.0.0',
    description: 'AI Coding Assistant API',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      code: '/api/code',
      config: '/api/config',
      execute: '/api/execute',
      docs: '/api/docs',
    },
  });
});

// API Documentation endpoint (no auth required)
app.get('/api/docs', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'JARVIS API',
      version: '2.0.0',
      description: 'AI Coding Assistant API',
    },
    servers: [
      {
        url: `http://localhost:${config.interfaces.api.port}`,
        description: 'Local server'
      }
    ],
    paths: {
      '/api/chat': {
        post: {
          summary: 'Chat with AI',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', maxLength: 10000 },
                    conversationId: { type: 'string' },
                    stream: { type: 'boolean', default: false }
                  },
                  required: ['message'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      response: { type: 'string' },
                      conversationId: { type: 'string' },
                      usage: { type: 'object' },
                      model: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
      },
      '/api/chat/health': {
        get: {
          summary: 'Check AI service health',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Health status'
            }
          }
        }
      },
      '/api/code/generate': {
        post: {
          summary: 'Generate code',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    language: { type: 'string' },
                  },
                  required: ['description'],
                },
              },
            },
          },
        },
      },
      '/api/execute/command': {
        post: {
          summary: 'Execute shell command',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    command: { type: 'string' },
                    workingDir: { type: 'string' },
                    timeout: { type: 'number' }
                  },
                  required: ['command'],
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key'
        }
      }
    }
  });
});

// Authentication for protected routes
if (config.security.authentication.enabled) {
  app.use('/api/chat', authMiddleware);
  app.use('/api/code', authMiddleware);
  app.use('/api/execute', authMiddleware);
  app.use('/api/config', authMiddleware);
} else {
  // Optional auth - sets authenticated flag if valid token provided
  app.use('/api/', optionalAuthMiddleware);
}

// API Routes
app.use('/api/chat', chatRouter);
app.use('/api/code', codeRouter);
app.use('/api/config', configRouter);
app.use('/api/execute', executeRouter);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Server instance
let server: any = null;

// Start server
export function startServer(): void {
  const PORT = config.interfaces.api.port;
  
  server = app.listen(PORT, () => {
    logger.info(`🚀 JARVIS API Server running on http://localhost:${PORT}`);
    logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
    logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    logger.info(`🔒 Authentication: ${config.security.authentication.enabled ? 'Enabled' : 'Disabled'}`);
    logger.info(`⚡ Rate Limiting: ${config.security.rateLimiting.enabled ? 'Enabled' : 'Disabled'}`);
  });
}

// Graceful shutdown
export function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    
    logger.info('Shutting down API server...');
    
    // Stop accepting new connections
    server.close((err: Error) => {
      if (err) {
        logger.error('Error during server shutdown', err);
        reject(err);
      } else {
        // Cleanup resources
        aiClientManager.shutdown();
        logger.info('API server shut down successfully');
        resolve();
      }
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.warn('Forcing server shutdown');
      process.exit(1);
    }, 10000);
  });
}

// Handle process signals
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await stopServer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await stopServer();
  process.exit(0);
});

// Start if run directly
if (require.main === module) {
  try {
    startServer();
  } catch (error) {
    handleError(error, logger);
    process.exit(1);
  }
}

export { app };
