import crypto from 'crypto';
import { User, IUserDocument } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendMail } from '../utils/email';
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
} from '../utils/emailTemplates';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const REFRESH_COOKIE = 'savora_refresh';
const USER_CACHE_TTL = 120; // 2 min

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d in ms
  path: '/',
};

// ─── Register ─────────────────────────────────────────────────
export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');

  const user = new User({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    phone: data.phone,
  });

  const rawToken = user.generateEmailVerificationToken();
  await user.save();

  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;

  // Fire-and-forget both emails
  sendMail({ to: user.email, subject: 'Welcome to Savora!', html: welcomeEmail(user.name) }).catch(
    err => logger.error('Welcome email failed', { err })
  );
  sendMail({
    to: user.email,
    subject: 'Verify your Savora email',
    html: verificationEmail(user.name, verifyUrl),
  }).catch(err => logger.error('Verification email failed', { err }));

  return { userId: user._id.toString() };
}

// ─── Login ────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +refreshToken'
  );

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) throw new AppError('Account has been deactivated', 403, 'ACCOUNT_INACTIVE');

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before logging in',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    restaurantId: user.restaurantId?.toString(),
  });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await cache.del(`user:${user._id}`);

  return { accessToken, refreshToken, user };
}

// ─── Refresh tokens ───────────────────────────────────────────
export async function refreshTokens(token: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw new AppError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');
  }

  const newAccessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    restaurantId: user.restaurantId?.toString(),
  });
  const newRefreshToken = signRefreshToken({ userId: user._id.toString() });

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ─── Logout ───────────────────────────────────────────────────
export async function logout(userId: string) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  await cache.del(`user:${userId}`);
}

// ─── Verify email ─────────────────────────────────────────────
export async function verifyEmail(rawToken: string) {
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new AppError('Verification link is invalid or has expired', 400, 'INVALID_TOKEN');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
}

// ─── Resend verification ──────────────────────────────────────
export async function resendVerification(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+emailVerificationToken +emailVerificationExpires'
  );

  if (!user) return; // silent — don't reveal if email exists
  if (user.isVerified) throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');

  const rawToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your Savora email',
    html: verificationEmail(user.name, verifyUrl),
  });
}

// ─── Forgot password ──────────────────────────────────────────
export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordResetOtp +passwordResetExpires'
  );

  if (!user) return; // silent

  const otp = user.generatePasswordResetOtp();
  await user.save({ validateBeforeSave: false });

  await sendMail({
    to: user.email,
    subject: 'Your Savora password reset OTP',
    html: passwordResetEmail(user.name, otp),
  });
}

// ─── Reset password ───────────────────────────────────────────
export async function resetPassword(email: string, otp: string, newPassword: string) {
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    passwordResetOtp: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetOtp +passwordResetExpires +refreshToken');

  if (!user) {
    throw new AppError('OTP is invalid or has expired', 400, 'INVALID_OTP');
  }

  user.password = newPassword;
  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined; // invalidate all sessions
  await user.save();

  await cache.del(`user:${user._id}`);

  sendMail({
    to: user.email,
    subject: 'Your Savora password has been changed',
    html: passwordChangedEmail(user.name),
  }).catch(err => logger.error('Password changed email failed', { err }));
}

// ─── Get current user ─────────────────────────────────────────
export async function getMe(userId: string): Promise<IUserDocument> {
  const cacheKey = `user:${userId}`;
  const cached = await cache.get<IUserDocument>(cacheKey);
  if (cached) return cached;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  await cache.set(cacheKey, user.toJSON(), USER_CACHE_TTL);
  return user;
}

// ─── Update profile ───────────────────────────────────────────
export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string; avatar?: string }
) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);

  await cache.del(`user:${userId}`);
  return user;
}

// ─── Change password ──────────────────────────────────────────
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');

  user.password = newPassword;
  await user.save();

  await cache.del(`user:${userId}`);

  sendMail({
    to: user.email,
    subject: 'Your Savora password has been changed',
    html: passwordChangedEmail(user.name),
  }).catch(err => logger.error('Password changed email failed', { err }));
}

export { REFRESH_COOKIE };
