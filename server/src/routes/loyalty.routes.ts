import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize, isManager } from '../middleware/role';
import { apiLimiter } from '../middleware/rateLimiter';
import * as loyalty from '../controllers/loyalty.controller';

const router = Router();

router.use(authenticate, apiLimiter);

router.get('/my-points', loyalty.getMyPoints);
router.post('/redeem', loyalty.redeemPoints);
router.post('/earn', isManager, loyalty.earnPoints);
router.get('/restaurant/:restaurantId/leaderboard', isManager, loyalty.getLeaderboard);

export default router;
