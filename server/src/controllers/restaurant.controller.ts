import { Request, Response } from 'express';
import { z } from 'zod';
import * as restaurantService from '../services/restaurant.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';

// ─── Validation schemas ───────────────────────────────────────
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const contactSchema = z.object({
  phone: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal('')),
});

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  address: addressSchema,
  contact: contactSchema,
  cuisine: z.array(z.string()).min(1),
});

const updateSchema = createSchema.partial();

const settingsSchema = z.object({
  settings: z
    .object({
      taxRate: z.number().min(0).max(100).optional(),
      serviceCharge: z.number().min(0).max(100).optional(),
      currency: z.string().length(3).optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  openingHours: z
    .array(
      z.object({
        day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        open: z.string().optional(),
        close: z.string().optional(),
        isClosed: z.boolean().optional(),
      })
    )
    .optional(),
});

// ─── GET /restaurants ─────────────────────────────────────────
export const listRestaurants = asyncHandler(async (req: Request, res: Response) => {
  const { data, pagination } = await restaurantService.list(req.query as Record<string, string>);
  return ApiResponse.paginated(res, data, pagination);
});

// ─── GET /restaurants/:slug ───────────────────────────────────
export const getRestaurantBySlug = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantService.getBySlug(req.params.slug);
  return ApiResponse.success(res, restaurant);
});

// ─── POST /restaurants ────────────────────────────────────────
export const createRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);

  // Attach uploaded image if present
  const imageUrl = (req.file as any)?.path as string | undefined;
  const data: Record<string, unknown> = { ...body };
  if (imageUrl) {
    const field = (req.body.imageType as string) === 'logo' ? 'logo' : 'coverImage';
    data[field] = imageUrl;
  }

  const restaurant = await restaurantService.create(data as any);
  return ApiResponse.created(res, restaurant, 'Restaurant created');
});

// ─── PATCH /restaurants/:id ───────────────────────────────────
export const updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const data: Record<string, unknown> = { ...body };

  const imageUrl = (req.file as any)?.path as string | undefined;
  if (imageUrl) {
    const field = (req.body.imageType as string) === 'logo' ? 'logo' : 'coverImage';
    data[field] = imageUrl;
  }

  const restaurant = await restaurantService.update(req.params.id, data as any);
  return ApiResponse.success(res, restaurant, 'Restaurant updated');
});

// ─── DELETE /restaurants/:id ──────────────────────────────────
export const deleteRestaurant = asyncHandler(async (_req: Request, res: Response) => {
  await restaurantService.softDelete(_req.params.id);
  return ApiResponse.noContent(res);
});

// ─── PATCH /restaurants/:id/settings ─────────────────────────
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const body = settingsSchema.parse(req.body);
  const restaurant = await restaurantService.updateSettings(req.params.id, body);
  return ApiResponse.success(res, restaurant, 'Settings updated');
});

// ─── GET /restaurants/:id/stats ──────────────────────────────
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await restaurantService.getStats(req.params.id);
  return ApiResponse.success(res, stats);
});
