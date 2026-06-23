import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

const LOG_DIR = path.join(process.cwd(), 'logs');

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack
      ? `[${ts}] ${level}: ${message}${metaStr}\n${stack}`
      : `[${ts}] ${level}: ${message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const rotateOptions = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  format: prodFormat,
};

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  silent: process.env.NODE_ENV === 'test',
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    }),
    new DailyRotateFile({
      ...rotateOptions,
      dirname: LOG_DIR,
      filename: 'savora-%DATE%.log',
      maxFiles: '14d',
      level: 'info',
    }),
    new DailyRotateFile({
      ...rotateOptions,
      dirname: LOG_DIR,
      filename: 'savora-error-%DATE%.log',
      maxFiles: '30d',
      level: 'error',
    }),
  ],
  exitOnError: false,
});

// Morgan stream adapter
export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
