import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { isManager, isStaff } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';
import * as staff from '../controllers/staff.controller';

const router = Router();

router.use(authenticate, apiLimiter);

router.get('/restaurant/:restaurantId', isStaff, staff.listStaff);
router.post('/invite', isManager, staff.inviteStaff);
router.patch('/:id', isManager, staff.updateStaff);
router.delete('/:id', isManager, staff.deactivateStaff);
router.get('/:id/schedule', isStaff, staff.getSchedule);

export default router;
