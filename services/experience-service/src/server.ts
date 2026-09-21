import Fastify from 'fastify';
import cors from 'fastify-cors';
import { registerOpenAPI } from 'zod-openapi';
import { logger } from './utils/logger';
import { createFastifyZodProvider } from 'fastify-type-provider-zod';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = Fastify({
  logger: false, // Use custom winston logger
});

// Register OpenAPI provider
app.setValidatorCompiler(({ schema }) => {
  return createFastifyZodProvider(schema);
});

// Register CORS
app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
});

// Register OpenAPI
app.register(registerOpenAPI, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'TravelPlatform Experience Service',
      version: '1.0.0',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  exposeRoute: true,
  swagger: {
    ui: {
      basePath: '',
      hideDocumentation: false,
    },
  },
});

// Health check
app.get('/health/live', {
  schema: {
    summary: 'Liveness probe',
    tags: ['health'],
    response: {
      200: {
        description: 'Service is alive',
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['UP'] },
        },
      },
    },
  },
}, async (request, reply) => {
  return { status: 'UP' };
});

app.get('/health/ready', {
  schema: {
    summary: 'Readiness probe',
    tags: ['health'],
    response: {
      200: {
        description: 'Service is ready',
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['UP'] },
        },
      },
    },
  },
}, async (request, reply) => {
  return { status: 'UP' };
});

// Start server
async function start() {
  try {
    await app.ready();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`Experience service listening on port ${PORT}`);
  } catch (err) {
    logger.error(err, 'Server failed to start');
    process.exit(1);
  }
}

start();
