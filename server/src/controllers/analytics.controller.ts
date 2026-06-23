import { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

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
