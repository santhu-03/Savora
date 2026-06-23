import { Router } from 'express';
import * as menu from '../controllers/menu.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { menuImagesUpload } from '../middleware/upload';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.use(apiLimiter);

// Menus
router.get('/menus', menu.getMenus);
router.post('/menus', authenticate, authorize('admin', 'manager'), menu.createMenu);
router.patch('/menus/:id', authenticate, authorize('admin', 'manager'), menu.updateMenu);
router.delete('/menus/:id', authenticate, authorize('admin', 'manager'), menu.deleteMenu);

// Items
router.get('/items', menu.getItems);
router.get('/items/search', menu.searchItems);
router.get('/items/:id', menu.getItemById);
router.post('/items', authenticate, authorize('admin', 'manager', 'kitchen'), menuImagesUpload, menu.createItem);
router.patch('/items/:id', authenticate, authorize('admin', 'manager', 'kitchen'), menu.updateItem);
router.patch('/items/:id/availability', authenticate, authorize('admin', 'manager', 'kitchen'), menu.toggleAvailability);
router.delete('/items/:id', authenticate, authorize('admin', 'manager'), menu.deleteItem);

export default router;
