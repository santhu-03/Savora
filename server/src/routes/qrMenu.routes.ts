import { Router } from 'express';
import { getQrMenu } from '../controllers/menuItem.controller';

const router = Router();

// Completely public — scanned by guests with no session
router.get('/:tableId', getQrMenu);

export default router;
