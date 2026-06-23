import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createOrder,
  getMyOrders,
  getRestaurantOrders,
  getOrderById,
  getLiveOrders,
  updateStatus,
  cancelOrder,
  OrderService,        // kept for old restaurant-scoped routes
} from '../services/order.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { OrderStatus } from '../models/Order';

// ─── Validation schemas ───────────────────────────────────────
const modifierSchema = z.object({
  name: z.string(),
  value: z.string(),
  price: z.coerce.number().min(0),
});

const itemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  modifiers: z.array(modifierSchema).optional(),
  specialInstructions: z.string().max(300).optional(),
});

const deliveryAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  instructions: z.string().max(300).optional(),
});

const createSchema = z.object({
  restaurantId: z.string().min(1),
  type: z.enum(['dine-in', 'takeaway', 'delivery']),
  tableId: z.string().optional(),
  items: z.array(itemSchema).min(1),
  paymentMethod: z.enum(['card', 'cash', 'wallet', 'upi']).optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

const statusSchema = z.object({
  status: z.enum([
    'pending', 'confirmed', 'preparing', 'ready',
    'out_for_delivery', 'delivered', 'cancelled',
  ]),
});

// ─── POST /orders ─────────────────────────────────────────────
export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);
  const order = await createOrder({ ...body, customerId: req.user?.userId });
  return ApiResponse.created(res, order, 'Order placed successfully');
});

// ─── GET /orders/my-orders ────────────────────────────────────
export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  const { data, pagination } = await getMyOrders(req.user!.userId, req.query as Record<string, string>);
  return ApiResponse.paginated(res, data, pagination);
});

// ─── GET /orders/restaurant/:restaurantId ─────────────────────
export const restaurantOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await getRestaurantOrders(
    req.params.restaurantId,
    req.query as Record<string, string>
  );
  return ApiResponse.paginated(res, result.data as any[], result.pagination as any);
});

// ─── GET /orders/restaurant/:restaurantId/live ────────────────
export const liveOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await getLiveOrders(req.params.restaurantId);
  return ApiResponse.success(res, orders);
});

// ─── GET /orders/:id ──────────────────────────────────────────
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const order = await getOrderById(req.params.id, req.user!);
  return ApiResponse.success(res, order);
});

// ─── PATCH /orders/:id/status ─────────────────────────────────
export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const order = await updateStatus(req.params.id, status as OrderStatus, req.user!.userId);
  return ApiResponse.success(res, order, `Order ${status}`);
});

// ─── PATCH /orders/:id/cancel ─────────────────────────────────
export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const order = await cancelOrder(req.params.id, req.user!.userId, req.user!.role);
  return ApiResponse.success(res, order, 'Order cancelled');
});

// ─── Legacy handlers kept for /restaurants/:id/orders routes ──
export const createOrder_legacy = asyncHandler(async (req: Request, res: Response) => {
  const data = z
    .object({
      tableId: z.string().optional(),
      type: z.enum(['dine-in', 'takeaway', 'delivery']).default('dine-in'),
      items: z.array(itemSchema).min(1),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const order = await OrderService.create({
    ...data,
    restaurantId: req.params.restaurantId,
    customerId: req.user?.userId,
  });
  return ApiResponse.created(res, order);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrderService.findByRestaurant(
    req.params.restaurantId,
    req.query as Record<string, string>
  );
  return ApiResponse.paginated(res, (result as any).data, (result as any).pagination);
});

export const getOrderById_legacy = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.findById(req.params.id);
  return ApiResponse.success(res, order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({ status: z.string() }).parse(req.body);
  const order = await OrderService.updateStatus(req.params.id, status, req.user!.userId);
  return ApiResponse.success(res, order);
});

export const cancelOrder_legacy = asyncHandler(async (req: Request, res: Response) => {
  const order = await OrderService.cancel(req.params.id, '', req.user!.userId);
  return ApiResponse.success(res, order);
});

// Backward-compat aliases for old order.routes.ts
export { createOrder_legacy as createOrder };
export { getOrderById_legacy as getOrderById };
export { cancelOrder_legacy as cancelOrder };
