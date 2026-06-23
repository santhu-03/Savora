import { Router } from 'express';
import * as category from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { menuImageUpload } from '../middleware/upload';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(apiLimiter);

// Public — list categories with item counts
router.get('/restaurant/:restaurantId', category.listCategories);

// manager+ — CRUD
router.post(
  '/',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  menuImageUpload,
  category.createCategory
);

router.patch(
  '/reorder',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  category.reorderCategories
);

router.patch(
  '/:id',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  menuImageUpload,
  category.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('manager', 'admin', 'super_admin'),
  category.deleteCategory
);

export default router;
