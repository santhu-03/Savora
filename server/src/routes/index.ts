import { Router } from 'express';
import authRoutes from './auth.routes';
import restaurantRoutes from './restaurant.routes';
import categoryRoutes from './category.routes';
import menuItemRoutes from './menuItem.routes';
import qrMenuRoutes from './qrMenu.routes';
import ordersRoutes from './orders.routes';
import reservationsRoutes from './reservations.routes';
import paymentRoutes from './payment.routes';
import menuRoutes from './menu.routes';
import tableRoutes from './table.routes';
import reviewRoutes from './review.routes';
import analyticsRoutes from './analytics.routes';
import analyticsV2Routes from './analytics.v2.routes';
import inventoryRoutes from './inventory.routes';
import inventoryV2Routes from './inventory.v2.routes';
import notificationRoutes from './notification.routes';
import kitchenRoutes from './kitchen.routes';
import staffRoutes from './staff.routes';
import loyaltyRoutes from './loyalty.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Savora API is running', timestamp: new Date() });
});

// Top-level resource routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/qr-menu', qrMenuRoutes);
router.use('/orders', ordersRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);

// Operational routes
router.use('/kitchen', kitchenRoutes);
router.use('/staff', staffRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/inventory', inventoryV2Routes);
router.use('/analytics', analyticsV2Routes);

// Restaurant-scoped sub-resource routes
const rid = ':restaurantId';
router.use(`/restaurants/${rid}/menu`, menuRoutes);
router.use(`/restaurants/${rid}/tables`, tableRoutes);
router.use(`/restaurants/${rid}/reviews`, reviewRoutes);
router.use(`/restaurants/${rid}/analytics`, analyticsRoutes);
router.use(`/restaurants/${rid}/inventory`, inventoryRoutes);

export default router;
