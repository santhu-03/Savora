import { Router } from 'express';
import * as restaurant from '../controllers/restaurant.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { restaurantImageUpload } from '../middleware/upload';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(apiLimiter);

// Public
router.get('/', restaurant.listRestaurants);
router.get('/:slug', restaurant.getRestaurantBySlug);

// super_admin only — create / delete
router.post(
  '/',
  authenticate,
  authorize('super_admin'),
  restaurantImageUpload,
  restaurant.createRestaurant
);

router.delete(
  '/:id',
  authenticate,
  authorize('super_admin'),
  restaurant.deleteRestaurant
);

// admin / super_admin — update core info
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  restaurantImageUpload,
  restaurant.updateRestaurant
);

// manager+ — update settings / hours
router.patch(
  '/:id/settings',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  restaurant.updateSettings
);

// admin+ — dashboard stats
router.get(
  '/:id/stats',
  authenticate,
  authorize('admin', 'super_admin'),
  restaurant.getStats
);

export default router;
