import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(authenticate, authorize('admin', 'manager', 'super_admin'));
router.use(apiLimiter);

router.get('/dashboard', analytics.getDashboard);
router.get('/revenue', analytics.getRevenue);
router.get('/top-items', analytics.getTopItems);
router.get('/peak-hours', analytics.getPeakHours);
router.get('/customers', analytics.getCustomerStats);

export default router;
