import { Request, Response } from 'express';
import { z } from 'zod';
import { Inventory } from '../models/Inventory.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { parsePagination, buildMeta } from '../utils/pagination';
import { getIO } from '../config/socket';

const TXN_ADD_TYPES = ['purchase', 'return'];
const TXN_SUB_TYPES = ['usage', 'waste'];

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

// ─── Top-level /api/inventory routes ─────────────────────────

// GET /api/v1/inventory/restaurant/:restaurantId
export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = parsePagination(req.query as Record<string, string>);
  const filter: Record<string, unknown> = { restaurant: req.params.restaurantId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [data, total] = await Promise.all([
    Inventory.find(filter).sort(sort).skip(skip).limit(limit),
    Inventory.countDocuments(filter),
  ]);

  const lowStockCount = await Inventory.countDocuments({
    restaurant: req.params.restaurantId,
    status: { $in: ['low_stock', 'out_of_stock'] },
  });

  return ApiResponse.paginated(res, data, buildMeta(total, page, limit), { lowStockCount });
});

// POST /api/v1/inventory
export const addInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const body = z
    .object({
      restaurantId: z.string().min(1),
      name: z.string().min(1),
      sku: z.string().min(1),
      category: z.string().min(1),
      unit: z.enum(['kg', 'g', 'l', 'ml', 'pcs', 'dozen', 'box', 'pack']),
      currentStock: z.coerce.number().min(0).default(0),
      reorderLevel: z.coerce.number().min(0),
      reorderQuantity: z.coerce.number().min(1),
      maxStock: z.coerce.number().min(1),
      unitCost: z.coerce.number().min(0),
      description: z.string().optional(),
      storageLocation: z.string().optional(),
      supplier: z
        .object({
          name: z.string(),
          contact: z.string(),
          email: z.string().email().optional(),
          leadTime: z.number().default(1),
        })
        .optional(),
    })
    .parse(req.body);

  const { restaurantId, ...rest } = body;
  const item = await Inventory.create({ ...rest, restaurant: restaurantId });
  return ApiResponse.created(res, item);
});

// PATCH /api/v1/inventory/:id
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await Inventory.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!item) throw new AppError('Inventory item not found', 404);
  return ApiResponse.success(res, item);
});

// POST /api/v1/inventory/:id/transaction
export const logTransaction = asyncHandler(async (req: Request, res: Response) => {
  const body = z
    .object({
      type: z.enum(['purchase', 'usage', 'waste', 'adjustment', 'return']),
      quantity: z.coerce.number(),
      unit: z.enum(['kg', 'g', 'l', 'ml', 'pcs', 'dozen', 'box', 'pack']),
      unitCost: z.coerce.number().optional(),
      supplier: z.string().optional(),
      invoiceNumber: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const item = await Inventory.findById(req.params.id);
  if (!item) throw new AppError('Inventory item not found', 404);

  if (TXN_ADD_TYPES.includes(body.type)) {
    item.currentStock += body.quantity;
    if (body.type === 'purchase') (item as any).lastRestockedAt = new Date();
  } else if (TXN_SUB_TYPES.includes(body.type)) {
    item.currentStock = Math.max(0, item.currentStock - body.quantity);
  } else {
    // adjustment — quantity can be positive (add) or negative (remove)
    item.currentStock = Math.max(0, item.currentStock + body.quantity);
  }

  if (body.unitCost != null) item.totalValue = item.currentStock * body.unitCost;

  (item as any).transactions.push({
    ...body,
    totalCost: body.unitCost != null ? body.quantity * body.unitCost : undefined,
    performedBy: req.user!.userId,
    createdAt: new Date(),
  });

  await item.save();

  // Emit low stock alert if stock dropped to or below reorder level
  if (TXN_SUB_TYPES.includes(body.type) && item.currentStock <= item.reorderLevel) {
    const io = getIO();
    const restaurantId = (item as any).restaurant?.toString();
    if (io && restaurantId) {
      io.to(`restaurant:${restaurantId}`).emit('low_stock_alert', {
        itemId:       item._id.toString(),
        itemName:     item.name,
        category:     item.category,
        currentStock: item.currentStock,
        threshold:    item.reorderLevel,
        unit:         item.unit,
        restaurantId,
      });
    }
  }

  return ApiResponse.success(res, item, 'Transaction logged');
});

// GET /api/v1/inventory/restaurant/:restaurantId/low-stock
export const getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await Inventory.find({
    restaurant: req.params.restaurantId,
    status: { $in: ['low_stock', 'out_of_stock'] },
  }).sort({ currentStock: 1 });

  return ApiResponse.success(res, items);
});

// GET /api/v1/inventory/restaurant/:restaurantId/report
export const getUsageReport = asyncHandler(async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 86_400_000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();

  const report = await Inventory.aggregate([
    { $match: { restaurant: (req.params.restaurantId as any) } },
    { $unwind: '$transactions' },
    { $match: { 'transactions.createdAt': { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$transactions.type',
        totalQuantity: { $sum: '$transactions.quantity' },
        totalCost: { $sum: '$transactions.totalCost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byItem = await Inventory.aggregate([
    { $match: { restaurant: (req.params.restaurantId as any) } },
    { $unwind: '$transactions' },
    { $match: { 'transactions.createdAt': { $gte: from, $lte: to }, 'transactions.type': 'usage' } },
    {
      $group: {
        _id: { id: '$_id', name: '$name', unit: '$unit' },
        totalUsed: { $sum: '$transactions.quantity' },
        txnCount: { $sum: 1 },
      },
    },
    { $sort: { totalUsed: -1 } },
    { $limit: 20 },
  ]);

  return ApiResponse.success(res, {
    period: { from, to },
    summary: report,
    topUsedItems: byItem.map(r => ({
      id: r._id.id,
      name: r._id.name,
      unit: r._id.unit,
      totalUsed: r.totalUsed,
      txnCount: r.txnCount,
    })),
  });
});
