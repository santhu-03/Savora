import { Router } from 'express';
import * as menuItem from '../controllers/menuItem.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { menuImagesUpload } from '../middleware/upload';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(apiLimiter);

// Public routes — no auth required
router.get('/restaurant/:restaurantId', menuItem.getMenu);
router.get('/restaurant/:restaurantId/featured', menuItem.getFeaturedItems);
router.get('/:id', menuItem.getItem);

// staff+ — toggle availability (kitchen / staff role)
router.patch(
  '/:id/toggle-availability',
  authenticate,
  authorize('staff', 'kitchen', 'manager', 'admin', 'super_admin'),
  menuItem.toggleAvailability
);

// manager+ — full CRUD
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  menuImagesUpload,
  menuItem.createItem
);

router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  menuImagesUpload,
  menuItem.updateItem
);

router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  menuItem.deleteItem
);

export default router;
