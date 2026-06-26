import { Request, Response } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../config/socket';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

function restaurantId(req: Request): string {
  const id = (req.query.restaurantId as string) ?? req.user!.restaurantId;
  if (!id) throw new AppError('restaurantId is required', 400);
  return id;
}

// GET /api/v1/kitchen/orders
export const getKitchenOrders = asyncHandler(async (req: Request, res: Response) => {
  const rid = restaurantId(req);
  const raw = req.query.status as string | undefined;
  const statuses = raw ? raw.split(',') : ACTIVE_STATUSES;

  const orders = await Order.find({ restaurant: rid, status: { $in: statuses } })
    .populate('table', 'number section')
    .populate('items.menuItem', 'name preparationTime')
    .sort({ priority: -1, placedAt: 1 });

  return ApiResponse.success(res, orders);
});

// PATCH /api/v1/kitchen/orders/:id/item-status
export const updateItemStatus = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, status } = z
    .object({
      itemId: z.string().min(1),
      status: z.enum(['pending', 'preparing', 'ready', 'served', 'cancelled']),
    })
    .parse(req.body);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const item = (order as any).items.id(itemId);
  if (!item) throw new AppError('Item not found in order', 404);

  item.status = status;
  if (status === 'ready') item.preparedAt = new Date();
  if (status === 'served') item.servedAt = new Date();

  const activeItems = (order.items as any[]).filter(i => i.status !== 'cancelled');
  const allReady =
    activeItems.length > 0 && activeItems.every(i => i.status === 'ready' || i.status === 'served');

  if (allReady && (order as any).status !== 'ready') {
    (order as any).status = 'ready';
    (order as any).readyAt = new Date();
  }

  await order.save();

  const io = getIO();
  if (io) {
    const rId = (order as any).restaurant ?? (order as any).restaurantId;
    const itemPayload = { orderId: order._id, itemId, status, allItemsReady: allReady };
    io.to(`kitchen:${rId}`)    .emit('order_item_ready', itemPayload);
    io.to(`restaurant:${rId}`) .emit('order_item_ready', itemPayload);
    io.to(`order:${order._id}`).emit('order_item_ready', itemPayload);
    if (allReady) {
      const readyPayload = { orderId: order._id, orderNumber: (order as any).orderNumber, status: 'ready' };
      io.to(`restaurant:${rId}`).emit('order_status_updated', readyPayload);
      io.to(`order:${order._id}`).emit('order_status_updated', readyPayload);
      if ((order as any).customer) {
        io.to(`user:${(order as any).customer}`).emit('order_status_updated', readyPayload);
      }
    }
  }

  return ApiResponse.success(res, order, 'Item status updated');
});

// PATCH /api/v1/kitchen/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z
    .object({ status: z.enum(['confirmed', 'preparing', 'ready', 'served', 'cancelled']) })
    .parse(req.body);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  (order as any).status = status;
  if (status === 'confirmed' && !(order as any).confirmedAt) (order as any).confirmedAt = new Date();
  if (status === 'preparing' && !(order as any).preparingAt) (order as any).preparingAt = new Date();
  if (status === 'ready' && !(order as any).readyAt) (order as any).readyAt = new Date();
  if (status === 'cancelled') (order as any).cancelledAt = new Date();

  await order.save();

  const io = getIO();
  if (io) {
    const rId = (order as any).restaurant ?? (order as any).restaurantId;
    const statusPayload = { orderId: order._id, orderNumber: (order as any).orderNumber, status };
    io.to(`kitchen:${rId}`)    .emit('order_status_updated', statusPayload);
    io.to(`restaurant:${rId}`) .emit('order_status_updated', statusPayload);
    io.to(`order:${order._id}`).emit('order_status_updated', statusPayload);
    if ((order as any).customer) {
      io.to(`user:${(order as any).customer}`).emit('order_status_updated', statusPayload);
    }
  }

  return ApiResponse.success(res, order, `Order ${status}`);
});

// GET /api/v1/kitchen/queue
export const getQueue = asyncHandler(async (req: Request, res: Response) => {
  const rid = restaurantId(req);

  const orders = await Order.find({
    restaurant: rid,
    status: { $in: ['pending', 'confirmed', 'preparing'] },
  })
    .populate('table', 'number section')
    .populate('items.menuItem', 'name preparationTime')
    .sort({ priority: -1, placedAt: 1 });

  const now = Date.now();
  const queue = orders.map(order => {
    const maxPrepMin = (order.items as any[]).reduce((max: number, item: any) => {
      return Math.max(max, (item.menuItem as any)?.preparationTime ?? 15);
    }, 0);
    const placedMs = ((order as any).placedAt as Date).getTime();
    const estimatedReadyAt = new Date(placedMs + maxPrepMin * 60_000);
    const minutesRemaining = Math.max(0, Math.ceil((estimatedReadyAt.getTime() - now) / 60_000));
    return { ...(order as any).toObject(), estimatedReadyAt, minutesRemaining };
  });

  return ApiResponse.success(res, queue);
});
