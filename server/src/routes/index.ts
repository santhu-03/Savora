import { Router } from 'express';
import authRoutes from './auth.routes';
import restaurantRoutes from './restaurant.routes';
import categoryRoutes from './category.routes';
import menuItemRoutes from './menuItem.routes';
import qrMenuRoutes from './qrMenu.routes';
import menuRoutes from './menu.routes';
import orderRoutes from './order.routes';
import reservationRoutes from './reservation.routes';
import tableRoutes from './table.routes';
import paymentRoutes from './payment.routes';
import reviewRoutes from './review.routes';
import analyticsRoutes from './analytics.routes';
import inventoryRoutes from './inventory.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Savora API is running', timestamp: new Date() });
});

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/qr-menu', qrMenuRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);

// Restaurant-scoped routes
const rid = ':restaurantId';
router.use(`/restaurants/${rid}`, menuRoutes);
router.use(`/restaurants/${rid}/orders`, orderRoutes);
router.use(`/restaurants/${rid}/reservations`, reservationRoutes);
router.use(`/restaurants/${rid}/tables`, tableRoutes);
router.use(`/restaurants/${rid}/reviews`, reviewRoutes);
router.use(`/restaurants/${rid}/analytics`, analyticsRoutes);
router.use(`/restaurants/${rid}/inventory`, inventoryRoutes);

export default router;
