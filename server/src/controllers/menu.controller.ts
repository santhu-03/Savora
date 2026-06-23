import { Request, Response } from 'express';
import { z } from 'zod';
import { MenuService } from '../services/menu.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const getMenus = asyncHandler(async (req: Request, res: Response) => {
  const menus = await MenuService.getMenus(req.params.restaurantId);
  ApiResponse.success(res, menus);
});

export const createMenu = asyncHandler(async (req: Request, res: Response) => {
  const menu = await MenuService.createMenu(req.params.restaurantId, req.body);
  ApiResponse.created(res, menu);
});

export const updateMenu = asyncHandler(async (req: Request, res: Response) => {
  const menu = await MenuService.updateMenu(req.params.id, req.params.restaurantId, req.body);
  ApiResponse.success(res, menu);
});

export const deleteMenu = asyncHandler(async (req: Request, res: Response) => {
  await MenuService.deleteMenu(req.params.id, req.params.restaurantId);
  ApiResponse.noContent(res);
});

export const getItems = asyncHandler(async (req: Request, res: Response) => {
  const result = await MenuService.getItems(req.params.restaurantId, req.query as Record<string, string>);
  ApiResponse.paginated(res, result.data, result.pagination);
});

export const searchItems = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = z.object({ q: z.string().min(1), limit: z.coerce.number().optional() }).parse(req.query);
  const items = await MenuService.searchItems(req.params.restaurantId, q, limit);
  ApiResponse.success(res, items);
});

export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuService.getItemById(req.params.id);
  ApiResponse.success(res, item);
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const images = (req.files as Express.Multer.File[])?.map((f: any) => ({ url: f.path, publicId: f.filename })) ?? [];
  const item = await MenuService.createItem(req.params.restaurantId, { ...req.body, images });
  ApiResponse.created(res, item);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuService.updateItem(req.params.id, req.params.restaurantId, req.body);
  ApiResponse.success(res, item);
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  await MenuService.deleteItem(req.params.id, req.params.restaurantId);
  ApiResponse.noContent(res);
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuService.toggleAvailability(req.params.id, req.params.restaurantId);
  ApiResponse.success(res, item);
});
