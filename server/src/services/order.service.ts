import { Order, IOrderDocument } from '../models/Order.model';
import { MenuItem } from '../models/MenuItem.model';
import { Table } from '../models/Table.model';
import { LoyaltyPoints } from '../models/LoyaltyPoints.model';
import { Notification } from '../models/Notification.model';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { parsePagination, buildMeta } from '../utils/pagination';
import { PaginatedResult } from '../types';
import { getIO } from '../config/socket';
import { logger } from '../utils/logger';

const POINTS_PER_RUPEE = 1;

export class OrderService {
  // ─── Create order ────────────────────────────────────────────
  static async create(data: {
    restaurantId: string;
    customerId?: string;
    guestInfo?: { name: string; email?: string; phone?: string };
    tableId?: string;
    reservationId?: string;
    type: string;
    items: Array<{ menuItemId: string; quantity: number; notes?: string; modifications?: unknown[] }>;
    notes?: string;
  }) {
    // Validate and price items
    const priced = await Promise.all(
      data.items.map(async item => {
        const mi = await MenuItem.findById(item.menuItemId);
        if (!mi) throw new AppError(`Menu item ${item.menuItemId} not found`, 404);
        if (!mi.isAvailable) throw new AppError(`${mi.name} is not available`, 400);
        const unitPrice = mi.discountedPrice ?? mi.basePrice;
        return {
          menuItem: mi._id,
          name: mi.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
          modifications: (item.modifications ?? []) as any[],
          notes: item.notes,
          status: 'pending' as const,
        };
      })
    );

    const subtotal = priced.reduce((s, i) => s + i.totalPrice, 0);
    const taxAmount = subtotal * 0.05;
    const serviceCharge = subtotal * 0.1;
    const total = subtotal + taxAmount + serviceCharge;

    const order = await Order.create({
      restaurant: data.restaurantId,
      customer: data.customerId,
      guestInfo: data.guestInfo,
      table: data.tableId,
      reservation: data.reservationId,
      items: priced,
      type: data.type,
      subtotal,
      taxAmount,
      serviceCharge,
      total,
      notes: data.notes,
    });

    // Update table status
    if (data.tableId) {
      await Table.findByIdAndUpdate(data.tableId, {
        status: 'occupied',
        currentOrder: order._id,
        lastStatusChange: new Date(),
      });
      getIO()?.to('tables').emit('tableStatusChanged', { tableId: data.tableId, status: 'occupied' });
    }

    // Broadcast to kitchen
    getIO()?.to('kitchen').emit('newOrder', order);

    // Invalidate cache
    await cache.delPattern(`orders:${data.restaurantId}:*`);

    return order;
  }

  // ─── Update status ───────────────────────────────────────────
  static async updateStatus(orderId: string, status: string, userId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const prev = order.status;
    order.status = status as any;

    const now = new Date();
    const timestamps: Record<string, Date> = {
      confirmed: order.confirmedAt = now,
      preparing: order.preparingAt = now,
      ready: order.readyAt = now,
      completed: order.completedAt = now,
      cancelled: order.cancelledAt = now,
    };

    if (status === 'completed' && order.customer) {
      const earned = Math.floor(order.total * POINTS_PER_RUPEE);
      order.loyaltyPointsEarned = earned;
      await LoyaltyPoints.findOneAndUpdate(
        { customer: order.customer, restaurant: order.restaurant },
        {
          $inc: { currentPoints: earned, lifetimePoints: earned },
          $push: { transactions: { type: 'earn', points: earned, orderId: order._id, description: `Order ${order.orderNumber}`, createdAt: new Date() } },
        },
        { upsert: true }
      );
    }

    if (status === 'completed' || status === 'cancelled') {
      await Table.findByIdAndUpdate(order.table, { status: 'cleaning', currentOrder: null, lastStatusChange: now });
      getIO()?.to('tables').emit('tableStatusChanged', { tableId: order.table, status: 'cleaning' });
    }

    await order.save();

    getIO()?.to('kitchen').to('waitstaff').emit('orderStatusChanged', { orderId, status, prev });
    await cache.delPattern(`orders:${order.restaurant}:*`);

    logger.info('Order status updated', { orderId, prev, status, userId });
    return order;
  }

  // ─── Find by restaurant ───────────────────────────────────────
  static async findByRestaurant(restaurantId: string, query: Record<string, string>) {
    const { page, limit, skip, sort } = parsePagination(query);
    const filter: Record<string, unknown> = { restaurant: restaurantId };
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.date) {
      const d = new Date(query.date);
      filter.placedAt = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const [data, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limit).populate('table', 'number').populate('customer', 'name email'),
      Order.countDocuments(filter),
    ]);

    return { data, pagination: buildMeta(total, page, limit) } as PaginatedResult<IOrderDocument>;
  }

  // ─── Find by ID ───────────────────────────────────────────────
  static async findById(orderId: string) {
    const order = await Order.findById(orderId)
      .populate('table', 'number section')
      .populate('customer', 'name email phone')
      .populate('items.menuItem', 'name images');
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  // ─── Cancel ──────────────────────────────────────────────────
  static async cancel(orderId: string, reason: string, userId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 400);
    }
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    await order.save();

    getIO()?.to('kitchen').emit('orderCancelled', { orderId });
    return order;
  }
}
