import { Router } from 'express';
import {
  listInventory,
  addInventoryItem,
  updateItem,
  logTransaction,
  getLowStockItems,
  getUsageReport,
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { isManager, isStaff } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate, apiLimiter);

router.get('/restaurant/:restaurantId', isStaff, listInventory);
router.get('/restaurant/:restaurantId/low-stock', isStaff, getLowStockItems);
router.get('/restaurant/:restaurantId/report', isManager, getUsageReport);
router.post('/', isManager, addInventoryItem);
router.patch('/:id', isManager, updateItem);
router.post('/:id/transaction', isStaff, logTransaction);

export default router;
