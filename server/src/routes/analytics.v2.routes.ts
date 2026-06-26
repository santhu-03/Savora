import { Router } from 'express';
import {
  getOverview,
  getRevenueChart,
  getTopItemsV2,
  getPeakHoursV2,
  getCustomersV2,
  getReviewAnalytics,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { isManager } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate, isManager, apiLimiter);

router.get('/restaurant/:restaurantId/overview', getOverview);
router.get('/restaurant/:restaurantId/revenue', getRevenueChart);
router.get('/restaurant/:restaurantId/top-items', getTopItemsV2);
router.get('/restaurant/:restaurantId/peak-hours', getPeakHoursV2);
router.get('/restaurant/:restaurantId/customers', getCustomersV2);
router.get('/restaurant/:restaurantId/reviews', getReviewAnalytics);

export default router;
