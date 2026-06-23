import { Router } from 'express';
import * as table from '../controllers/table.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(apiLimiter);

router.get('/', authenticate, authorize('admin', 'manager', 'staff'), table.getTables);
router.post('/', authenticate, authorize('admin', 'manager'), table.createTable);
router.patch('/:id', authenticate, authorize('admin', 'manager'), table.updateTable);
router.patch('/:id/status', authenticate, authorize('admin', 'manager', 'staff'), table.updateTableStatus);
router.delete('/:id', authenticate, authorize('admin', 'manager'), table.deleteTable);

export default router;
