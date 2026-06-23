import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5_000;

export const connectDB = async (retriesLeft = MAX_RETRIES): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
    });

    logger.info(`MongoDB connected — ${mongoose.connection.host}`);

    mongoose.connection.on('error', err => logger.error('MongoDB error', { err }));

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — scheduling reconnect');
      setTimeout(() => connectDB(1), RETRY_DELAY_MS);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed on app termination');
      process.exit(0);
    });
  } catch (err) {
    if (retriesLeft > 0) {
      logger.warn(`MongoDB connection failed — retrying in ${RETRY_DELAY_MS / 1000}s (${retriesLeft} left)`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(retriesLeft - 1);
    }
    logger.error('MongoDB connection failed after maximum retries', { err });
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('MongoDB disconnected gracefully');
};
