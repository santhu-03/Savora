import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export class AppError extends Error {
  readonly statusCode: number;
  readonly status: 'fail' | 'error';
  readonly isOperational: boolean;
  readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Known error normalizers ──────────────────────────────────
const handleZodError = (err: ZodError) => {
  const errors: Record<string, string[]> = {};
  err.errors.forEach(e => {
    const key = e.path.join('.');
    errors[key] = errors[key] ?? [];
    errors[key].push(e.message);
  });
  return new AppError('Validation failed', 422);
};

const handleMongoError = (err: MongoError) => {
  if (err.code === 11000) {
    const field = Object.keys((err as any).keyValue ?? {})[0] ?? 'field';
    return new AppError(`${field} already exists`, 409, 'DUPLICATE_KEY');
  }
  return new AppError('Database error', 500);
};

const handleValidationError = (err: mongoose.Error.ValidationError) => {
  const message = Object.values(err.errors).map(e => e.message).join(', ');
  return new AppError(message, 422, 'VALIDATION_ERROR');
};

const handleJwtError = () => new AppError('Invalid token', 401, 'INVALID_TOKEN');
const handleJwtExpired = () => new AppError('Token expired', 401, 'TOKEN_EXPIRED');

// ─── 404 handler ─────────────────────────────────────────────
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
};

// ─── Global error handler ─────────────────────────────────────
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err instanceof AppError ? err : new AppError('Internal server error', 500);

  if (err instanceof ZodError) error = handleZodError(err);
  else if (err instanceof mongoose.Error.ValidationError) error = handleValidationError(err);
  else if ((err as MongoError).code === 11000) error = handleMongoError(err as MongoError);
  else if ((err as Error).name === 'JsonWebTokenError') error = handleJwtError();
  else if ((err as Error).name === 'TokenExpiredError') error = handleJwtExpired();
  else if ((err as Error).name === 'CastError') error = new AppError('Invalid ID format', 400, 'INVALID_ID');

  if (error.statusCode >= 500) {
    logger.error('Unhandled error', {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    });
  }

  const body: Record<string, unknown> = {
    success: false,
    message: error.message,
  };
  if (error.code) body.code = error.code;
  if (process.env.NODE_ENV === 'development') body.stack = error.stack;

  res.status(error.statusCode).json(body);
};
