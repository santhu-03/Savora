import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initCloudinary } from './config/cloudinary';
import { initSocket } from './config/socket';
import { registerSocketHandlers } from './socket';
import { logger, morganStream } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import apiRouter from './routes';

const app = express();
const httpServer = createServer(app);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined', { stream: morganStream }));
app.use(cors({ origin: [env.clientUrl, env.adminUrl], credentials: true }));

// Stripe webhook needs raw Buffer — must come before express.json()
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/payments/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── Error handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ───────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDB();
  await connectRedis();
  initCloudinary();

  const io = initSocket(httpServer);
  registerSocketHandlers(io);

  httpServer.listen(env.port, () => {
    logger.info(`Savora Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
}

start().catch(err => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});
