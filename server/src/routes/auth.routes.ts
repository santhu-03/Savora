import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter, strictLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public — rate limited
router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/resend-verification', authLimiter, ctrl.resendVerification);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', strictLimiter, ctrl.resetPassword);

// Protected
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);
router.patch('/update-profile', authenticate, ctrl.updateProfile);
router.patch('/change-password', authenticate, ctrl.changePassword);

export default router;
