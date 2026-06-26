import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { room, EVENT, JoinRestaurantPayload, JoinTablePayload } from './events';
import { registerOrderHandler }        from './handlers/order.handler';
import { registerKitchenHandler }      from './handlers/kitchen.handler';
import { registerReservationHandler }  from './handlers/reservation.handler';
import { registerNotificationHandler } from './handlers/notification.handler';

export function registerSocketHandlers(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.debug('Socket connected', {
      socketId: socket.id,
      userId:   user?.userId,
      role:     user?.role,
    });

    // Auto-join personal user room
    if (user?.userId) {
      socket.join(room.user(user.userId));
    }

    // ── Room joins ────────────────────────────────────────────

    socket.on(EVENT.JOIN_RESTAURANT, ({ restaurantId }: JoinRestaurantPayload) => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });
      socket.join(room.restaurant(restaurantId));
      logger.debug('Joined restaurant room', { socketId: socket.id, restaurantId, role: user.role });
    });

    socket.on(EVENT.JOIN_TABLE, ({ restaurantId, tableId }: JoinTablePayload) => {
      socket.join(room.table(restaurantId, tableId));
    });

    // Backward-compat legacy room joins
    socket.on('join:restaurant', (payload: string | { restaurantId: string }) => {
      const id = typeof payload === 'string' ? payload : payload.restaurantId;
      socket.join(room.restaurant(id));
    });
    socket.on('join:kitchen', (payload?: { restaurantId: string }) => {
      if (payload?.restaurantId) socket.join(room.kitchen(payload.restaurantId));
    });
    socket.on('join:tables',   (p?: { restaurantId: string }) => { if (p?.restaurantId) socket.join(room.restaurant(p.restaurantId)); });
    socket.on('join:waitstaff',(p?: { restaurantId: string }) => { if (p?.restaurantId) socket.join(room.restaurant(p.restaurantId)); });
    socket.on('join:admin',    (p?: { restaurantId: string }) => { if (p?.restaurantId) socket.join(room.restaurant(p.restaurantId)); });

    // ── Domain handlers ───────────────────────────────────────
    registerOrderHandler(io, socket);
    registerKitchenHandler(io, socket);
    registerReservationHandler(io, socket);
    registerNotificationHandler(io, socket);

    // ── Lifecycle ─────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { socketId: socket.id, reason, userId: user?.userId });
    });

    socket.on('error', (err) => {
      logger.error('Socket error', { socketId: socket.id, err });
    });
  });
}
