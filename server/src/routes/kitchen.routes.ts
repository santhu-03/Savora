import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { minRole } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';
import * as kitchen from '../controllers/kitchen.controller';

const router = Router();

router.use(authenticate, minRole('staff'), apiLimiter);

router.get('/orders', kitchen.getKitchenOrders);
router.patch('/orders/:id/item-status', kitchen.updateItemStatus);
router.patch('/orders/:id/status', kitchen.updateOrderStatus);
router.get('/queue', kitchen.getQueue);

export default router;
