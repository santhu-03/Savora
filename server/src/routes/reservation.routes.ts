import { Router } from 'express';
import * as reservation from '../controllers/reservation.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { apiLimiter, strictLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.get('/availability', apiLimiter, reservation.checkAvailability);
router.post('/', strictLimiter, optionalAuth, reservation.createReservation);
router.get('/', authenticate, authorize('admin', 'manager', 'staff'), reservation.getReservations);
router.post('/:id/cancel', authenticate, reservation.cancelReservation);

export default router;
