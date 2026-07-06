import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import routes from './routes';
import { openApiSpec } from './docs/openapi';
import { notFound, errorHandler } from './middlewares/error.middleware';

/**
 * Build the Express app. Exported as a factory so tests can create a
 * fresh instance without starting an HTTP listener.
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '3mb' }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/', (_req, res) => {
    res.json({ message: 'Book CRUD API', resource: '/api/books', docs: '/docs', health: '/health' });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // Interactive API docs (Swagger UI) + raw OpenAPI JSON
  app.get('/docs.json', (_req, res) => res.json(openApiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use('/api', routes);

  // 404 + centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
