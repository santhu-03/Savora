import { Server as SocketServer, Socket } from 'socket.io';
import { Order } from '../../models/Order';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { cache } from '../../config/redis';
import {
  EVENT, room,
  KitchenUpdateStatusPayload,
  JoinOrderPayload,
  OrderStatusUpdatedPayload,
  OrderItemReadyPayload,
  OrderCancelledPayload,
} from '../events';

export function registerOrderHandler(io: SocketServer, socket: Socket): void {
  const user = socket.data.user;

  /**
   * Customer joins the tracking room for a specific order.
   * Emit the current state immediately so the UI hydrates.
   */
  socket.on(EVENT.JOIN_ORDER_TRACKING, async ({ orderId }: JoinOrderPayload) => {
    if (!orderId) return;
    socket.join(room.order(orderId));

    try {
      const order = await Order.findById(orderId)
        .select('orderNumber status estimatedTime type tableId items')
        .populate('tableId', 'tableNumber section')
        .lean();
      if (order) {
        socket.emit(EVENT.ORDER_STATUS_UPDATED, {
          orderId,
          orderNumber:   (order as any).orderNumber,
          status:        (order as any).status,
          estimatedTime: (order as any).estimatedTime,
        } satisfies OrderStatusUpdatedPayload);
      }
    } catch (err) {
      logger.error('join_order_tracking fetch failed', { orderId, err });
    }
  });

  /**
   * Kitchen staff update an individual item or the whole order status.
   * Persists to DB, then broadcasts to the kitchen room, restaurant room,
   * and the order's dedicated tracking room.
   */
  socket.on(
    EVENT.KITCHEN_UPDATE_STATUS,
    async ({ orderId, restaurantId, itemId, status }: KitchenUpdateStatusPayload) => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });

      try {
        const order = await Order.findById(orderId);
        if (!order) return;

        if (itemId) {
          // ── Update a single item ─────────────────────────────
          const item = (order.items as any[]).find(i => i._id.toString() === itemId);
          if (!item) return;

          item.status = status;
          if (status === 'ready')  item.preparedAt = new Date();
          if (status === 'served') item.servedAt   = new Date();

          const activeItems = (order.items as any[]).filter(i => i.status !== 'cancelled');
          const allReady = activeItems.length > 0 &&
            activeItems.every((i: any) => ['ready', 'served'].includes(i.status));

          await order.save();

          const itemPayload: OrderItemReadyPayload = {
            orderId,
            orderNumber:   order.orderNumber,
            itemId,
            itemName:      item.name,
            allItemsReady: allReady,
          };

          io.to(room.kitchen(restaurantId))    .emit(EVENT.ORDER_ITEM_READY, itemPayload);
          io.to(room.restaurant(restaurantId)) .emit(EVENT.ORDER_ITEM_READY, itemPayload);
          io.to(room.order(orderId))            .emit(EVENT.ORDER_ITEM_READY, itemPayload);

          // If all items done → auto-advance order to 'ready'
          if (allReady && order.status === 'preparing') {
            order.status = 'ready' as any;
            await order.save();

            const statusPayload: OrderStatusUpdatedPayload = {
              orderId,
              orderNumber: order.orderNumber,
              status:      'ready',
            };
            io.to(room.restaurant(restaurantId)).emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
            io.to(room.order(orderId))           .emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
            if (order.customerId) {
              io.to(room.user(order.customerId.toString())).emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
            }
          }
        } else {
          // ── Update whole order status ────────────────────────
          order.status = status as any;
          await order.save();

          const statusPayload: OrderStatusUpdatedPayload = {
            orderId,
            orderNumber: order.orderNumber,
            status:      status as any,
            updatedBy:   user.userId,
          };

          io.to(room.kitchen(restaurantId))    .emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
          io.to(room.restaurant(restaurantId)) .emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
          io.to(room.order(orderId))            .emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
          if (order.customerId) {
            io.to(room.user(order.customerId.toString())).emit(EVENT.ORDER_STATUS_UPDATED, statusPayload);
          }

          await cache.delPattern(`orders:${restaurantId}:*`);
        }
      } catch (err) {
        logger.error('kitchen_update_status failed', { orderId, itemId, status, err });
        socket.emit('error', { message: 'Failed to update status' });
      }
    }
  );
}
