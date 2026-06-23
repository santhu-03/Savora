import { Router } from 'express';
import * as inv from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(authenticate, authorize('admin', 'manager', 'kitchen'));
router.use(apiLimiter);

router.get('/', inv.getInventory);
router.get('/low-stock', inv.getLowStock);
router.post('/', inv.createInventoryItem);
router.patch('/:id', inv.updateInventoryItem);
router.post('/:id/adjust', inv.adjustStock);
router.delete('/:id', authorize('admin', 'manager'), inv.deleteInventoryItem);

export default router;
