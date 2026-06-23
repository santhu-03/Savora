import { Order } from '../models/Order.model';
import { Reservation } from '../models/Reservation.model';
import { Review } from '../models/Review.model';
import { Table } from '../models/Table.model';
import { cache } from '../config/redis';

export class AnalyticsService {
  // ─── Dashboard overview ──────────────────────────────────────
  static async getDashboardStats(restaurantId: string) {
    const cacheKey = `analytics:dashboard:${restaurantId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const [
      todayOrders,
      todayRevenue,
      todayReservations,
      totalTables,
      occupiedTables,
      pendingOrders,
      avgRating,
    ] = await Promise.all([
      Order.countDocuments({ restaurant: restaurantId, placedAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } }),
      Order.aggregate([
        { $match: { restaurant: restaurantId as any, placedAt: { $gte: today, $lt: tomorrow }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Reservation.countDocuments({ restaurant: restaurantId, date: { $gte: today, $lt: tomorrow }, status: { $in: ['confirmed', 'seated'] } }),
      Table.countDocuments({ restaurant: restaurantId, isActive: true }),
      Table.countDocuments({ restaurant: restaurantId, status: { $in: ['occupied', 'reserved'] } }),
      Order.countDocuments({ restaurant: restaurantId, status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      Review.aggregate([
        { $match: { restaurant: restaurantId as any, isPublished: true } },
        { $group: { _id: null, avg: { $avg: '$overallRating' } } },
      ]),
    ]);

    const stats = {
      today: {
        orders: todayOrders,
        revenue: todayRevenue[0]?.total ?? 0,
        reservations: todayReservations,
        pendingOrders,
      },
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        occupancyRate: totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0,
      },
      rating: Math.round((avgRating[0]?.avg ?? 0) * 10) / 10,
    };

    await cache.set(cacheKey, stats, 120);
    return stats;
  }

  // ─── Revenue by period ───────────────────────────────────────
  static async getRevenue(restaurantId: string, period: 'day' | 'week' | 'month' | 'year') {
    const cacheKey = `analytics:revenue:${restaurantId}:${period}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    let start: Date;
    let groupFormat: string;

    switch (period) {
      case 'day': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); groupFormat = '%H'; break;
      case 'week': start = new Date(now.getTime() - 7 * 86400000); groupFormat = '%Y-%m-%d'; break;
      case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); groupFormat = '%Y-%m-%d'; break;
      default: start = new Date(now.getFullYear(), 0, 1); groupFormat = '%Y-%m';
    }

    const data = await Order.aggregate([
      { $match: { restaurant: restaurantId as any, placedAt: { $gte: start }, paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: groupFormat, date: '$placedAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrder: { $avg: '$total' } } },
      { $sort: { _id: 1 } },
    ]);

    const result = data.map(d => ({ period: d._id, revenue: Math.round(d.revenue), orders: d.orders, avgOrder: Math.round(d.avgOrder) }));
    await cache.set(cacheKey, result, 300);
    return result;
  }

  // ─── Top menu items ───────────────────────────────────────────
  static async getTopItems(restaurantId: string, limit = 10) {
    const cacheKey = `analytics:topItems:${restaurantId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const data = await Order.aggregate([
      { $match: { restaurant: restaurantId as any, status: { $in: ['completed', 'served'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', name: { $first: '$items.name' }, totalOrders: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalOrders: -1 } },
      { $limit: limit },
    ]);

    await cache.set(cacheKey, data, 600);
    return data;
  }

  // ─── Peak hours ───────────────────────────────────────────────
  static async getPeakHours(restaurantId: string) {
    const cacheKey = `analytics:peakHours:${restaurantId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const data = await Order.aggregate([
      { $match: { restaurant: restaurantId as any, placedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { hour: { $hour: '$placedAt' }, day: { $dayOfWeek: '$placedAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { '_id.day': 1, '_id.hour': 1 } },
    ]);

    await cache.set(cacheKey, data, 3600);
    return data;
  }

  // ─── Customer stats ───────────────────────────────────────────
  static async getCustomerStats(restaurantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [newCustomers, returningCustomers] = await Promise.all([
      Order.distinct('customer', { restaurant: restaurantId, placedAt: { $gte: thirtyDaysAgo }, customer: { $exists: true } }),
      Order.aggregate([
        { $match: { restaurant: restaurantId as any, customer: { $exists: true } } },
        { $group: { _id: '$customer', visits: { $sum: 1 } } },
        { $match: { visits: { $gt: 1 } } },
        { $count: 'total' },
      ]),
    ]);
    return {
      newCustomers: newCustomers.length,
      returningCustomers: returningCustomers[0]?.total ?? 0,
    };
  }
}
