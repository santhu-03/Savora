import { Router } from 'express';
import * as payment from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { webhookLimiter, apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Webhook — no auth, no JSON body (raw body handled in src/index.ts)
router.post('/webhook', webhookLimiter, payment.webhook);

router.use(apiLimiter);

// Create Stripe PaymentIntent
router.post('/create-intent', authenticate, payment.createIntent);

// Confirm payment after client-side completion
router.post('/confirm', authenticate, payment.confirm);

// Admin: refund
router.post('/refund',
  authenticate,
  authorize('admin', 'manager', 'super_admin'),
  payment.processRefund
);

// Get payment record by order
router.get('/order/:orderId', authenticate, payment.getByOrder);

export default router;
