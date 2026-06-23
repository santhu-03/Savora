import { Request, Response } from 'express';
import { z } from 'zod';
import * as menuService from '../services/menuItem.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

// ─── Validation schemas ───────────────────────────────────────
const nutritionSchema = z.object({
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  category: z.string().min(1),
  restaurantId: z.string().min(1),
  dietary: z.array(z.enum(['veg', 'vegan', 'gluten-free', 'non-veg'])).optional(),
  allergens: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  nutritionInfo: nutritionSchema.optional(),
  prepTime: z.coerce.number().min(0).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
});

const updateSchema = createSchema.omit({ restaurantId: true }).partial();

// ─── GET /menu-items/restaurant/:restaurantId ─────────────────
export const getMenu = asyncHandler(async (req: Request, res: Response) => {
  const result = await menuService.getMenuByRestaurant(
    req.params.restaurantId,
    req.query as Record<string, string>
  );
  return ApiResponse.success(res, result);
});

// ─── GET /menu-items/restaurant/:restaurantId/featured ────────
export const getFeaturedItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await menuService.getFeatured(req.params.restaurantId);
  return ApiResponse.success(res, items);
});

// ─── GET /menu-items/:id ──────────────────────────────────────
export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await menuService.getById(req.params.id);
  return ApiResponse.success(res, item);
});

// ─── POST /menu-items ─────────────────────────────────────────
export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, ...rest } = createSchema.parse(req.body);
  const files = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
  const item = await menuService.create(restaurantId, rest as any, files);
  return ApiResponse.created(res, item, 'Menu item created');
});

// ─── PATCH /menu-items/:id ────────────────────────────────────
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const restaurantId = req.body.restaurantId as string;
  const files = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
  const item = await menuService.update(req.params.id, restaurantId, body as any, files);
  return ApiResponse.success(res, item, 'Menu item updated');
});

// ─── DELETE /menu-items/:id ───────────────────────────────────
export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.body.restaurantId as string;
  await menuService.remove(req.params.id, restaurantId);
  return ApiResponse.noContent(res);
});

// ─── PATCH /menu-items/:id/toggle-availability ───────────────
export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.body.restaurantId as string;
  const item = await menuService.toggleAvailability(req.params.id, restaurantId);
  return ApiResponse.success(res, item, `Item marked ${item.isAvailable ? 'available' : 'unavailable'}`);
});

// ─── GET /qr-menu/:tableId ────────────────────────────────────
export const getQrMenu = asyncHandler(async (req: Request, res: Response) => {
  const data = await menuService.getQrMenu(req.params.tableId);
  return ApiResponse.success(res, data);
});
