import { Request, Response } from 'express';
import { z } from 'zod';
import { Inventory } from '../models/Inventory.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { parsePagination, buildMeta } from '../utils/pagination';

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = parsePagination(req.query as Record<string, string>);
  const filter: Record<string, unknown> = { restaurant: req.params.restaurantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [data, total] = await Promise.all([
    Inventory.find(filter).sort(sort).skip(skip).limit(limit),
    Inventory.countDocuments(filter),
  ]);
  ApiResponse.paginated(res, data, buildMeta(total, page, limit));
});

export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await Inventory.create({ ...req.body, restaurant: req.params.restaurantId });
  ApiResponse.created(res, item);
});

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await Inventory.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.params.restaurantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) throw new AppError('Inventory item not found', 404);
  ApiResponse.success(res, item);
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { quantity, reason, type } = z.object({
    quantity: z.number(),
    reason: z.string().optional(),
    type: z.enum(['addition', 'removal', 'adjustment', 'wastage']),
  }).parse(req.body);

  const item = await Inventory.findOne({ _id: req.params.id, restaurant: req.params.restaurantId });
  if (!item) throw new AppError('Inventory item not found', 404);

  (item as any).currentStock += quantity;
  const doc = item as any;
  doc.stockMovements = doc.stockMovements ?? [];
  doc.stockMovements.push({ type, quantity, reason, date: new Date(), recordedBy: req.user!.userId });
  await item.save();

  ApiResponse.success(res, item);
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const items = await Inventory.find({ restaurant: req.params.restaurantId, status: { $in: ['low_stock', 'out_of_stock'] } });
  ApiResponse.success(res, items);
});

export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await Inventory.findOneAndDelete({ _id: req.params.id, restaurant: req.params.restaurantId });
  if (!item) throw new AppError('Inventory item not found', 404);
  ApiResponse.noContent(res);
});
