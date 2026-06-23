import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { cache } from '../config/redis';
import { logger } from '../utils/logger';

const message = (windowMin: number, max: number) => ({
  success: false,
  message: `Too many requests — limit is ${max} per ${windowMin} minutes. Please try again later.`,
  code: 'RATE_LIMITED',
});

// ─── Auth routes ──────────────────────────────────────────────
// 10 attempts per 15 min — prevents brute-force login attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15, 10),
  keyGenerator: (req: Request) => req.ip ?? 'unknown',
});

// ─── General API ──────────────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(15, 300),
  skip: (req: Request) => req.ip === '127.0.0.1',
});

// ─── Upload endpoints ─────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: message(60, 30),
});

// ─── Strict — password reset, verification emails, etc. ───────
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: message(60, 5),
});

// ─── Stripe webhook ───────────────────────────────────────────
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: message(1, 60),
});

// ─── Redis-backed OTP / verification limiter ─────────────────
export const otpLimiter = async (identifier: string): Promise<boolean> => {
  const key = `otp_limit:${identifier}`;
  try {
    const count = await cache.incr(key, 10 * 60); // 10-min window
    if (count > 3) {
      logger.warn('OTP rate limit exceeded', { identifier });
      return false;
    }
    return true;
  } catch {
    return true; // fail open if Redis unavailable
  }
};
