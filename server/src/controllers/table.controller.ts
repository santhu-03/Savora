import { Request, Response } from 'express';
import { z } from 'zod';
import { Table } from '../models/Table.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';

export const getTables = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `tables:${req.params.restaurantId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const tables = await Table.find({ restaurant: req.params.restaurantId }).sort({ number: 1 });
  await cache.set(cacheKey, tables, 60);
  ApiResponse.success(res, tables);
});

export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await Table.create({ ...req.body, restaurant: req.params.restaurantId });
  await cache.del(`tables:${req.params.restaurantId}`);
  ApiResponse.created(res, table);
});

export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await Table.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.params.restaurantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!table) throw new AppError('Table not found', 404);
  await cache.del(`tables:${req.params.restaurantId}`);
  ApiResponse.success(res, table);
});

export const updateTableStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({ status: z.string() }).parse(req.body);
  const table = await Table.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.params.restaurantId },
    { status, lastStatusChange: new Date() },
    { new: true }
  );
  if (!table) throw new AppError('Table not found', 404);
  await cache.del(`tables:${req.params.restaurantId}`);
  ApiResponse.success(res, table);
});

export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await Table.findOneAndDelete({ _id: req.params.id, restaurant: req.params.restaurantId });
  if (!table) throw new AppError('Table not found', 404);
  await cache.del(`tables:${req.params.restaurantId}`);
  ApiResponse.noContent(res);
});
