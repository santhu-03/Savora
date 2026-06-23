import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderService } from '../services/order.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

const itemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
  modifications: z.array(z.unknown()).optional(),
});

const createOrderSchema = z.object({
  tableId: z.string().optional(),
  reservationId: z.string().optional(),
  type: z.enum(['dine_in', 'takeaway', 'delivery', 'room_service']),
  items: z.array(itemSchema).min(1),
  notes: z.string().optional(),
  guestInfo: z.object({ name: z.string(), email: z.string().optional(), phone: z.string().optional() }).optional(),
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = createOrderSchema.parse(req.body);
  const order = await OrderService.create({
    ...data,
    restaurantId: req.params.restaurantId,
    customerId: req.user?.userId,
  });
  ApiResponse.created(res, order);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrderService.findByRestaurant(req.params.restaurantId, req.query as Record<string, string>);
  ApiResponse.paginated(res, result.data, result.pagination);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.findById(req.params.id);
  ApiResponse.success(res, order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({ status: z.string() }).parse(req.body);
  const order = await OrderService.updateStatus(req.params.id, status, req.user!.userId);
  ApiResponse.success(res, order);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = z.object({ reason: z.string().default('Customer request') }).parse(req.body);
  const order = await OrderService.cancel(req.params.id, reason, req.user!.userId);
  ApiResponse.success(res, order);
});
