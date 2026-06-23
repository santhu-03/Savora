import { Request, Response } from 'express';
import { z } from 'zod';
import * as AuthService from '../services/auth.service';
import { COOKIE_OPTIONS, REFRESH_COOKIE } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// ─── Validation schemas ───────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

// ─── Helpers ─────────────────────────────────────────────────
const ok = (res: Response, data: unknown, message: string, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_COOKIE, token, COOKIE_OPTIONS);

const clearRefreshCookie = (res: Response) =>
  res.clearCookie(REFRESH_COOKIE, { path: '/' });

// ─── Handlers ────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const result = await AuthService.register(body);
  ok(res, result, 'Registration successful — please verify your email', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await AuthService.login(email, password);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken, user }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError('Refresh token not provided', 401, 'NO_TOKEN');
  const { accessToken, refreshToken } = await AuthService.refreshTokens(token);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.logout(req.user!.userId);
  clearRefreshCookie(res);
  ok(res, null, 'Logged out successfully');
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
  const user = await AuthService.verifyEmail(token);
  ok(res, { userId: user._id }, 'Email verified successfully');
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  await AuthService.resendVerification(email);
  ok(res, null, 'Verification email sent if account exists');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotSchema.parse(req.body);
  await AuthService.forgotPassword(email);
  ok(res, null, 'If that email exists, a reset OTP has been sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, password } = resetSchema.parse(req.body);
  await AuthService.resetPassword(email, otp, password);
  clearRefreshCookie(res);
  ok(res, null, 'Password reset successful — please log in');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getMe(req.user!.userId);
  ok(res, { user }, 'User retrieved');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await AuthService.updateProfile(req.user!.userId, data);
  ok(res, { user }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await AuthService.changePassword(req.user!.userId, currentPassword, newPassword);
  clearRefreshCookie(res);
  ok(res, null, 'Password changed — please log in again');
});
