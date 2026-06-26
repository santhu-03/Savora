import { Router } from 'express';
import { getQrMenu } from '../controllers/menuItem.controller';
import { placeGuestOrder } from '../controllers/qr.controller';

const router = Router();

// POST before GET /:tableId to avoid path shadowing
router.post('/order', placeGuestOrder);

// Completely public — scanned by guests with no session
router.get('/:tableId', getQrMenu);

export default router;
