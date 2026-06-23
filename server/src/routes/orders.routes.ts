import { Router } from 'express';
import * as order from '../controllers/order.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(apiLimiter);

// ─── Specific named paths BEFORE /:id ────────────────────────
router.get('/my-orders', authenticate, order.myOrders);

// Restaurant staff views — specific before param
router.get(
  '/restaurant/:restaurantId/live',
  authenticate,
  authorize('staff', 'kitchen', 'manager', 'admin', 'super_admin'),
  order.liveOrders
);
router.get(
  '/restaurant/:restaurantId',
  authenticate,
  authorize('staff', 'kitchen', 'manager', 'admin', 'super_admin'),
  order.restaurantOrders
);

// ─── Create ───────────────────────────────────────────────────
router.post('/', optionalAuth, order.create);

// ─── Parameterised order routes ───────────────────────────────
router.get('/:id', authenticate, order.getOne);
router.patch('/:id/status',
  authenticate,
  authorize('staff', 'kitchen', 'manager', 'admin', 'super_admin'),
  order.changeStatus
);
router.patch('/:id/cancel', authenticate, order.cancel);

export default router;
