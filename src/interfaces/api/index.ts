/**
 * JARVIS HTTP API
 * RESTful API for programmatic access to JARVIS features
 */

import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { loadConfig } from '../../core/config';
import { logger } from '../../core/utils/logger';
import { handleError } from '../../core/utils/errors';
import { chatRouter } from './routes/chat';
import { codeRouter } from './routes/code';
import { configRouter } from './routes/config';
import { executeRouter } from './routes/execute';
import { authMiddleware } from './middleware/auth';
import { sanitizationMiddleware } from './middleware/sanitization';

const app = express();

// Load configuration
const config = loadConfig();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Rate limiting
if (config.security.rateLimiting.enabled) {
  const limiter = rateLimit({
    windowMs: config.security.rateLimiting.windowMs,
    max: config.security.rateLimiting.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', limiter);
}

// Input sanitization
if (config.security.inputSanitization.enabled) {
  app.use('/api/', sanitizationMiddleware);
}

// Authentication (if enabled)
if (config.security.authentication.enabled) {
  app.use('/api/', authMiddleware);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// API Routes
app.use('/api/chat', chatRouter);
app.use('/api/code', codeRouter);
app.use('/api/config', configRouter);
app.use('/api/execute', executeRouter);

// Root endpoint
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
      docs: '/api/docs',
    },
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'JARVIS API',
      version: '2.0.0',
      description: 'AI Coding Assistant API',
    },
    paths: {
      '/api/chat': {
        post: {
          summary: 'Chat with AI',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    conversationId: { type: 'string' },
                  },
                  required: ['message'],
                },
              },
            },
          },
        },
      },
      '/api/code/generate': {
        post: {
          summary: 'Generate code',
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
      '/api/code/explain': {
        post: {
          summary: 'Explain code',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    language: { type: 'string' },
                  },
                  required: ['code'],
                },
              },
            },
          },
        },
      },
      '/api/code/review': {
        post: {
          summary: 'Review code',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    language: { type: 'string' },
                  },
                  required: ['code'],
                },
              },
            },
          },
        },
      },
    },
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error:', err);
  
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

// Start server
const PORT = config.interfaces.api.port;

export function startServer(): void {
  app.listen(PORT, () => {
    logger.info(`🚀 JARVIS API Server running on http://localhost:${PORT}`);
    logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
    logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
  });
}

// Start if run directly
if (require.main === module) {
  try {
    startServer();
  } catch (error) {
    handleError(error, logger);
  }
}

export { app };
