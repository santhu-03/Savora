import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { room, EVENT } from '../events';

// In-memory presence map: restaurantId → Set<socketId>
const staffPresence = new Map<string, Set<string>>();

export function registerNotificationHandler(io: SocketServer, socket: Socket): void {
  const user = socket.data.user;

  // ── Staff presence ──────────────────────────────────────────
  socket.on(
    'presence:join',
    ({ restaurantId }: { restaurantId: string }) => {
      if (!user) return;

      if (!staffPresence.has(restaurantId)) {
        staffPresence.set(restaurantId, new Set());
      }
      staffPresence.get(restaurantId)!.add(socket.id);

      io.to(room.restaurant(restaurantId)).emit('staff:online', {
        userId:  user.userId,
        role:    user.role,
        socketId:socket.id,
      });
    }
  );

  socket.on('disconnect', () => {
    if (!user) return;
    // Remove from all presence sets
    staffPresence.forEach((socketIds, restaurantId) => {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        io.to(room.restaurant(restaurantId)).emit('staff:offline', {
          userId:   user.userId,
          socketId: socket.id,
        });
        logger.debug('Staff went offline', { userId: user.userId, restaurantId });
      }
    });
  });

  // ── Chat / support ─────────────────────────────────────────
  socket.on(
    'chat:message',
    ({ to, message, from }: { to: string; message: string; from: string }) => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });
      io.to(room.user(to)).emit('chat:message', {
        from,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  );

  // ── Admin broadcast (e.g., system alerts) ─────────────────
  socket.on(
    'admin:broadcast',
    ({ restaurantId, event, payload }: { restaurantId: string; event: string; payload: unknown }) => {
      if (!user || !['admin', 'manager', 'super_admin'].includes(user.role)) {
        return socket.emit('error', { message: 'Unauthorized' });
      }
      io.to(room.restaurant(restaurantId)).emit(event, payload);
      logger.info('Admin broadcast', { restaurantId, event });
    }
  );
}

/**
 * Emitted by the inventory service when stock drops below threshold.
 * Called directly (not via socket event) — requires io instance.
 */
export function emitLowStockAlert(
  io: SocketServer,
  restaurantId: string,
  payload: Parameters<typeof io.to>[0] extends string ? unknown : never
): void {
  io.to(room.restaurant(restaurantId)).emit(EVENT.LOW_STOCK_ALERT, payload);
}
