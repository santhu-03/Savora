import { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { cache } from '../config/redis';
import { Order } from '../models/Order.model';
import { Review } from '../models/Review.model';

// ─── Existing restaurant-scoped handlers ──────────────────────

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await AnalyticsService.getDashboardStats(req.params.restaurantId);
  ApiResponse.success(res, stats);
});

export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { period } = z.object({ period: z.enum(['day', 'week', 'month', 'year']).default('week') }).parse(req.query);
  const data = await AnalyticsService.getRevenue(req.params.restaurantId, period);
  ApiResponse.success(res, data);
});

export const getTopItems = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = z.object({ limit: z.coerce.number().default(10) }).parse(req.query);
  const data = await AnalyticsService.getTopItems(req.params.restaurantId, limit);
  ApiResponse.success(res, data);
});

export const getPeakHours = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getPeakHours(req.params.restaurantId);
  ApiResponse.success(res, data);
});

export const getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getCustomerStats(req.params.restaurantId);
  ApiResponse.success(res, data);
});

// ─── Date-range helpers ───────────────────────────────────────

const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

function parseDateRange(query: Record<string, unknown>) {
  const { from, to } = dateRangeSchema.parse(query);
  return {
    from: from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000),
    to: to ? new Date(to) : new Date(),
  };
}

// ─── New top-level handlers ───────────────────────────────────

// GET /api/v1/analytics/restaurant/:id/overview
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const rid = req.params.restaurantId;
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const cacheKey = `analytics:overview:${rid}:${from.toISOString()}:${to.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const periods = {
    today: { start: new Date(new Date().setHours(0, 0, 0, 0)), end: new Date() },
    week: { start: new Date(Date.now() - 7 * 86_400_000), end: new Date() },
    month: { start: new Date(Date.now() - 30 * 86_400_000), end: new Date() },
    year: { start: new Date(Date.now() - 365 * 86_400_000), end: new Date() },
  };

  const buildPeriodStats = async (start: Date, end: Date) => {
    const [revenueResult, ordersCount, uniqueCustomers] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant: rid as any, placedAt: { $gte: start, $lte: end }, paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, avg: { $avg: '$total' } } },
      ]),
      Order.countDocuments({ restaurant: rid, placedAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } }),
      Order.distinct('customer', { restaurant: rid, placedAt: { $gte: start, $lte: end }, customer: { $exists: true } }),
    ]);

    return {
      revenue: revenueResult[0]?.total ?? 0,
      avgOrderValue: Math.round(revenueResult[0]?.avg ?? 0),
      orders: ordersCount,
      customers: uniqueCustomers.length,
    };
  };

  const [todayStats, weekStats, monthStats, yearStats] = await Promise.all([
    buildPeriodStats(periods.today.start, periods.today.end),
    buildPeriodStats(periods.week.start, periods.week.end),
    buildPeriodStats(periods.month.start, periods.month.end),
    buildPeriodStats(periods.year.start, periods.year.end),
  ]);

  const overview = { today: todayStats, week: weekStats, month: monthStats, year: yearStats };
  await cache.set(cacheKey, overview, 300);
  return ApiResponse.success(res, overview);
});

// GET /api/v1/analytics/restaurant/:id/revenue
export const getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
  const rid = req.params.restaurantId;
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const { granularity } = z
    .object({ granularity: z.enum(['day', 'week', 'month']).default('day') })
    .parse(req.query);

  const cacheKey = `analytics:revenue2:${rid}:${from.toISOString()}:${to.toISOString()}:${granularity}`;
  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const fmtMap: Record<string, string> = { day: '%Y-%m-%d', week: '%Y-W%V', month: '%Y-%m' };

  const data = await Order.aggregate([
    { $match: { restaurant: rid as any, placedAt: { $gte: from, $lte: to }, paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
    { $group: { _id: { $dateToString: { format: fmtMap[granularity], date: '$placedAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrder: { $avg: '$total' } } },
    { $sort: { _id: 1 } },
  ]);

  const result = data.map(d => ({ period: d._id, revenue: Math.round(d.revenue), orders: d.orders, avgOrder: Math.round(d.avgOrder) }));
  await cache.set(cacheKey, result, 300);
  return ApiResponse.success(res, result);
});

// GET /api/v1/analytics/restaurant/:id/top-items
export const getTopItemsV2 = asyncHandler(async (req: Request, res: Response) => {
  const rid = req.params.restaurantId;
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }).parse(req.query);

  const cacheKey = `analytics:topItems2:${rid}:${from.toISOString()}:${to.toISOString()}:${limit}`;
  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const data = await Order.aggregate([
    { $match: { restaurant: rid as any, placedAt: { $gte: from, $lte: to }, status: { $in: ['completed', 'served'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.menuItem', name: { $first: '$items.name' }, totalOrders: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } },
    { $sort: { totalOrders: -1 } },
    { $limit: limit },
  ]);

  await cache.set(cacheKey, data, 300);
  return ApiResponse.success(res, data);
});

// GET /api/v1/analytics/restaurant/:id/peak-hours
export const getPeakHoursV2 = asyncHandler(async (req: Request, res: Response) => {
  const rid = req.params.restaurantId;
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const cacheKey = `analytics:peakHours2:${rid}:${from.toISOString()}:${to.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const data = await Order.aggregate([
    { $match: { restaurant: rid as any, placedAt: { $gte: from, $lte: to } } },
    { $group: { _id: { hour: { $hour: '$placedAt' }, day: { $dayOfWeek: '$placedAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    { $sort: { '_id.day': 1, '_id.hour': 1 } },
  ]);

  await cache.set(cacheKey, data, 300);
  return ApiResponse.success(res, data);
});

// GET /api/v1/analytics/restaurant/:id/customers
export const getCustomersV2 = asyncHandler(async (req: Request, res: Response) => {
  const rid = req.params.restaurantId;
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const cacheKey = `analytics:customers2:${rid}:${from.toISOString()}:${to.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const [newCustomersArr, returningArr, retentionArr] = await Promise.all([
    Order.distinct('customer', { restaurant: rid, placedAt: { $gte: from, $lte: to }, customer: { $exists: true } }),
    Order.aggregate([
      { $match: { restaurant: rid as any, customer: { $exists: true } } },
      { $group: { _id: '$customer', visits: { $sum: 1 } } },
      { $match: { visits: { $gt: 1 } } },
      { $count: 'total' },
    ]),
    Order.aggregate([
      { $match: { restaurant: rid as any, placedAt: { $gte: from, $lte: to }, customer: { $exists: true } } },
      { $group: { _id: { customer: '$customer', date: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt' } } } } },
      { $group: { _id: '$_id.date', uniqueVisitors: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const result = {
    newCustomers: newCustomersArr.length,
    returningCustomers: returningArr[0]?.total ?? 0,
    dailyVisitors: retentionArr.map((r: any) => ({ date: r._id, visitors: r.uniqueVisitors })),
  };

  await cache.set(cacheKey, result, 300);
  return ApiResponse.success(res, result);
});

// GET /api/v1/analytics/restaurant/:id/reviews
export const getReviewAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const rid = req.params.restaurantId;
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const cacheKey = `analytics:reviews:${rid}:${from.toISOString()}:${to.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const [summary, ratingDistribution, sentimentBreakdown, trendData] = await Promise.all([
    Review.aggregate([
      { $match: { restaurant: rid as any, createdAt: { $gte: from, $lte: to }, isPublished: true } },
      { $group: { _id: null, avgOverall: { $avg: '$overallRating' }, avgFood: { $avg: '$foodRating' }, avgService: { $avg: '$serviceRating' }, avgAmbiance: { $avg: '$ambianceRating' }, avgValue: { $avg: '$valueRating' }, total: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: { restaurant: rid as any, createdAt: { $gte: from, $lte: to }, isPublished: true } },
      { $group: { _id: '$overallRating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Review.aggregate([
      { $match: { restaurant: rid as any, createdAt: { $gte: from, $lte: to }, isPublished: true, sentiment: { $exists: true } } },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: { restaurant: rid as any, createdAt: { $gte: from, $lte: to }, isPublished: true } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avgRating: { $avg: '$overallRating' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const s = summary[0] ?? {};
  const result = {
    total: s.total ?? 0,
    averageRatings: {
      overall: +(s.avgOverall ?? 0).toFixed(1),
      food: +(s.avgFood ?? 0).toFixed(1),
      service: +(s.avgService ?? 0).toFixed(1),
      ambiance: +(s.avgAmbiance ?? 0).toFixed(1),
      value: +(s.avgValue ?? 0).toFixed(1),
    },
    ratingDistribution: ratingDistribution.map((r: any) => ({ rating: r._id, count: r.count })),
    sentiment: sentimentBreakdown.reduce((acc: any, r: any) => { acc[r._id] = r.count; return acc; }, {}),
    trend: trendData.map((r: any) => ({ date: r._id, avgRating: +(r.avgRating).toFixed(1), count: r.count })),
  };

  await cache.set(cacheKey, result, 300);
  return ApiResponse.success(res, result);
});
