import { Server as SocketServer, Socket } from 'socket.io';
import { Order } from '../../models/Order';
import { logger } from '../../utils/logger';
import { EVENT, room, JoinKitchenPayload } from '../events';

export function registerKitchenHandler(io: SocketServer, socket: Socket): void {
  const user = socket.data.user;

  /**
   * Kitchen screen joins its restaurant's dedicated kitchen room.
   * Immediately sends the current live order queue so the screen
   * hydrates without an additional REST call.
   */
  socket.on(EVENT.JOIN_KITCHEN, async ({ restaurantId }: JoinKitchenPayload) => {
    if (!user) return socket.emit('error', { message: 'Unauthorized' });

    const kitchenRoom = room.kitchen(restaurantId);
    socket.join(kitchenRoom);
    // Also join the restaurant room so staff events reach kitchen screens
    socket.join(room.restaurant(restaurantId));

    logger.debug('Kitchen screen joined', { socketId: socket.id, restaurantId });

    // Hydrate with active orders
    try {
      const orders = await Order.find({
        restaurantId,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
      })
        .sort({ createdAt: 1 })
        .populate('tableId', 'tableNumber section')
        .lean();

      socket.emit('kitchen:hydrate', orders);
    } catch (err) {
      logger.error('kitchen:hydrate failed', { restaurantId, err });
    }
  });

  // Kitchen screen leaves (cleanup handled by Socket.io on disconnect)
  socket.on(
    'kitchen:leave',
    ({ restaurantId }: { restaurantId: string }) => {
      socket.leave(room.kitchen(restaurantId));
      socket.leave(room.restaurant(restaurantId));
    }
  );
}
