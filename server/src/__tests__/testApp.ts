import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler, notFound } from '../middleware/errorHandler';
import apiRouter from '../routes';

// Lightweight test app — no HTTP server, no Socket.io, no DB connection.
// All external dependencies (socket, email, stripe, redis) must be mocked
// in each test file via jest.mock() before this module is imported.
export function createTestApp(): Application {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use('/api/v1', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
