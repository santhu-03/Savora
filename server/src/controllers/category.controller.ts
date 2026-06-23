import { Request, Response } from 'express';
import { z } from 'zod';
import * as categoryService from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

// ─── Validation schemas ───────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  restaurantId: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = createSchema.omit({ restaurantId: true }).partial();

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0),
    })
  ).min(1),
  restaurantId: z.string().min(1),
});

// ─── GET /categories/restaurant/:restaurantId ─────────────────
export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.listByRestaurant(req.params.restaurantId);
  return ApiResponse.success(res, categories);
});

// ─── POST /categories ─────────────────────────────────────────
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, ...rest } = createSchema.parse(req.body);
  const imageUrl = (req.file as any)?.path as string | undefined;
  const cat = await categoryService.create(restaurantId, { ...rest, ...(imageUrl && { image: imageUrl }) } as any);
  return ApiResponse.created(res, cat, 'Category created');
});

// ─── PATCH /categories/:id ────────────────────────────────────
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const restaurantId = req.body.restaurantId as string;
  const imageUrl = (req.file as any)?.path as string | undefined;
  const cat = await categoryService.update(req.params.id, restaurantId, {
    ...body,
    ...(imageUrl && { image: imageUrl }),
  } as any);
  return ApiResponse.success(res, cat, 'Category updated');
});

// ─── DELETE /categories/:id ───────────────────────────────────
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.body.restaurantId as string;
  await categoryService.remove(req.params.id, restaurantId);
  return ApiResponse.noContent(res);
});

// ─── PATCH /categories/reorder ────────────────────────────────
export const reorderCategories = asyncHandler(async (req: Request, res: Response) => {
  const { items, restaurantId } = reorderSchema.parse(req.body);
  await categoryService.reorder(restaurantId, items);
  return ApiResponse.success(res, null, 'Categories reordered');
});
