import { Router } from 'express';
import * as review from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/role';
import { reviewImagesUpload } from '../middleware/upload';
import { apiLimiter, strictLimiter } from '../middleware/rateLimiter';

const router = Router({ mergeParams: true });

router.get('/', apiLimiter, review.getReviews);
router.post('/', authenticate, strictLimiter, reviewImagesUpload, review.createReview);
router.post('/:id/respond', authenticate, authorize('admin', 'manager'), review.respondToReview);
router.delete('/:id', authenticate, review.deleteReview);

export default router;
