import { Router } from 'express';
import * as order from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(apiLimiter);

router.post('/', authenticate, order.createOrder);
router.get('/', authenticate, authorize('admin', 'manager', 'staff', 'kitchen'), order.getOrders);
router.get('/:id', authenticate, order.getOrderById);
router.patch('/:id/status', authenticate, authorize('admin', 'manager', 'staff', 'kitchen'), order.updateOrderStatus);
router.post('/:id/cancel', authenticate, order.cancelOrder);

export default router;
