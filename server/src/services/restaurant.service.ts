import mongoose from 'mongoose';
import { Restaurant, IRestaurantDocument } from '../models/Restaurant';
import { Order } from '../models/Order';
import { Reservation } from '../models/Reservation';
import { Review } from '../models/Review';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { parsePagination, buildMeta } from '../utils/pagination';

// ─── List with filters ────────────────────────────────────────
export async function list(query: Record<string, string>) {
  const { page, limit, skip, sort } = parsePagination({ sortBy: 'rating', sortOrder: 'desc', ...query });

  const filter: Record<string, unknown> = { isActive: true };
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.city) filter['address.city'] = { $regex: query.city, $options: 'i' };
  if (query.cuisine) filter.cuisine = { $in: query.cuisine.split(',') };

  const [data, total] = await Promise.all([
    Restaurant.find(filter).sort(sort).skip(skip).limit(limit).select('-settings -subscription'),
    Restaurant.countDocuments(filter),
  ]);

  return { data, pagination: buildMeta(total, page, limit) };
}

// ─── Get by slug ──────────────────────────────────────────────
export async function getBySlug(slug: string): Promise<IRestaurantDocument> {
  const cacheKey = `restaurant:slug:${slug}`;
  const cached = await cache.get<IRestaurantDocument>(cacheKey);
  if (cached) return cached;

  const r = await Restaurant.findOne({ slug, isActive: true });
  if (!r) throw new AppError('Restaurant not found', 404);

  await cache.set(cacheKey, r.toJSON(), 300);
  return r;
}

// ─── Get by ID ────────────────────────────────────────────────
export async function getById(id: string): Promise<IRestaurantDocument> {
  const r = await Restaurant.findById(id);
  if (!r) throw new AppError('Restaurant not found', 404);
  return r;
}

// ─── Create ───────────────────────────────────────────────────
export async function create(data: Partial<IRestaurantDocument>): Promise<IRestaurantDocument> {
  const r = await Restaurant.create(data);
  return r;
}

// ─── Update ───────────────────────────────────────────────────
export async function update(id: string, data: Partial<IRestaurantDocument>): Promise<IRestaurantDocument> {
  // Prevent overwriting rating/totalReviews via this endpoint
  delete (data as any).rating;
  delete (data as any).totalReviews;

  const r = await Restaurant.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!r) throw new AppError('Restaurant not found', 404);
  await cache.delPattern(`restaurant:*`);
  return r;
}

// ─── Soft delete ──────────────────────────────────────────────
export async function softDelete(id: string): Promise<void> {
  const r = await Restaurant.findByIdAndUpdate(id, { isActive: false });
  if (!r) throw new AppError('Restaurant not found', 404);
  await cache.delPattern(`restaurant:*`);
}

// ─── Update settings / opening hours ─────────────────────────
export async function updateSettings(
  id: string,
  data: { settings?: Record<string, unknown>; openingHours?: unknown[] }
): Promise<IRestaurantDocument> {
  const update: Record<string, unknown> = {};
  if (data.settings) {
    for (const [k, v] of Object.entries(data.settings)) {
      update[`settings.${k}`] = v;
    }
  }
  if (data.openingHours) update.openingHours = data.openingHours;

  const r = await Restaurant.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!r) throw new AppError('Restaurant not found', 404);
  await cache.delPattern(`restaurant:*`);
  return r;
}

// ─── Dashboard stats ──────────────────────────────────────────
export async function getStats(restaurantId: string) {
  const cacheKey = `restaurant:stats:${restaurantId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const rid = new mongoose.Types.ObjectId(restaurantId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const weekStart = new Date(Date.now() - 7 * 86_400_000);
  const monthStart = new Date(Date.now() - 30 * 86_400_000);

  const [
    todayOrders,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    todayReservations,
    pendingOrders,
    avgRating,
    totalMenuItems,
    totalCategories,
    revenueByDay,
  ] = await Promise.all([
    // Today's orders count
    Order.countDocuments({ restaurantId: rid, createdAt: { $gte: todayStart, $lt: todayEnd } }),

    // Today's revenue
    Order.aggregate([
      { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Week revenue
    Order.aggregate([
      { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Month revenue
    Order.aggregate([
      { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),

    // Today's reservations
    Reservation.countDocuments({ restaurantId: rid, date: { $gte: todayStart, $lt: todayEnd } }),

    // Pending/active orders
    Order.countDocuments({ restaurantId: rid, status: { $in: ['pending', 'confirmed', 'preparing'] } }),

    // Average rating
    Review.aggregate([
      { $match: { restaurantId: rid } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),

    // Menu items count
    MenuItem.countDocuments({ restaurantId: rid, isAvailable: true }),

    // Categories count
    Category.countDocuments({ restaurantId: rid, isActive: true }),

    // Revenue last 7 days by day
    Order.aggregate([
      { $match: { restaurantId: rid, paymentStatus: 'paid', createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const stats = {
    today: {
      orders: todayOrders,
      revenue: Math.round((todayRevenue[0]?.total ?? 0) * 100) / 100,
      reservations: todayReservations,
      pendingOrders,
    },
    week: { revenue: Math.round((weekRevenue[0]?.total ?? 0) * 100) / 100 },
    month: { revenue: Math.round((monthRevenue[0]?.total ?? 0) * 100) / 100 },
    rating: {
      average: Math.round((avgRating[0]?.avg ?? 0) * 10) / 10,
      total: avgRating[0]?.count ?? 0,
    },
    menu: { items: totalMenuItems, categories: totalCategories },
    revenueByDay,
  };

  await cache.set(cacheKey, stats, 120);
  return stats;
}
