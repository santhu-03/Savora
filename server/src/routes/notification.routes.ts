import { Router } from 'express';
import * as notif from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate, apiLimiter);

router.get('/', notif.getNotifications);
router.patch('/:id/read', notif.markRead);
router.patch('/read-all', notif.markAllRead);
router.delete('/:id', notif.deleteNotification);

export default router;
