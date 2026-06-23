import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { env } from './env';

let redisClient: Redis | null = null;
let redisAvailable = false;

export const connectRedis = (): Redis => {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: times => {
      if (times > 3) return null; // stop retrying silently
      return Math.min(times * 500, 2_000);
    },
  });

  redisClient.on('ready', () => {
    redisAvailable = true;
    logger.info('Redis connected');
  });
  redisClient.on('error', () => {
    redisAvailable = false;
  });
  redisClient.on('close', () => {
    redisAvailable = false;
  });

  redisClient.connect().catch(() => {
    logger.warn('Redis not available — running without cache');
  });

  return redisClient;
};

export const getRedis = (): Redis => {
  if (!redisClient) return connectRedis();
  return redisClient;
};

// ─── Typed cache helpers (all fail-open when Redis is down) ──
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisAvailable) return null;
    try {
      const val = await getRedis().get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSec = 300): Promise<void> {
    if (!redisAvailable) return;
    try {
      await getRedis().setex(key, ttlSec, JSON.stringify(value));
    } catch {
      // ignore
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!redisAvailable || !keys.length) return;
    try {
      await getRedis().del(...keys);
    } catch {
      // ignore
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redisAvailable) return;
    try {
      const keys = await getRedis().keys(pattern);
      if (keys.length) await getRedis().del(...keys);
    } catch {
      // ignore
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redisAvailable) return false;
    try {
      return (await getRedis().exists(key)) === 1;
    } catch {
      return false;
    }
  },

  async incr(key: string, ttlSec?: number): Promise<number> {
    if (!redisAvailable) return 0;
    try {
      const count = await getRedis().incr(key);
      if (ttlSec && count === 1) await getRedis().expire(key, ttlSec);
      return count;
    } catch {
      return 0;
    }
  },
};
