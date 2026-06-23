import { Router } from 'express';
import * as payment from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { webhookLimiter } from '../middleware/rateLimiter';
import express from 'express';

const router = Router();

// Raw body required for Stripe signature verification
router.post('/webhook', webhookLimiter, express.raw({ type: 'application/json' }), payment.handleWebhook);

router.post('/intent', authenticate, payment.createPaymentIntent);
router.post('/refund', authenticate, authorize('admin', 'manager'), payment.refund);

export default router;
