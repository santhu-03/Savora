import { Router } from 'express';
import * as reservation from '../controllers/reservation.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(apiLimiter);

// ─── Public / named paths BEFORE /:id ────────────────────────
router.get('/available-slots', optionalAuth, reservation.availableSlots);
router.get('/my-reservations', authenticate, reservation.myReservations);

// Cron job trigger (admin-only, hits via internal scheduler)
router.post('/send-reminder',
  authenticate,
  authorize('admin', 'super_admin'),
  reservation.sendReminderEmails
);

// Restaurant staff views
router.get(
  '/restaurant/:restaurantId',
  authenticate,
  authorize('staff', 'manager', 'admin', 'super_admin'),
  reservation.restaurantReservations
);

// ─── Create ───────────────────────────────────────────────────
router.post('/', authenticate, reservation.create);

// ─── Parameterised ───────────────────────────────────────────
router.patch('/:id/confirm',
  authenticate,
  authorize('staff', 'manager', 'admin', 'super_admin'),
  reservation.confirm
);
router.patch('/:id/status',
  authenticate,
  authorize('staff', 'manager', 'admin', 'super_admin'),
  reservation.changeStatus
);
router.delete('/:id', authenticate, reservation.cancel);

export default router;
