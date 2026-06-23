import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export function registerSocketHandlers(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    // ─── Kitchen events ──────────────────────────────────────────
    socket.on('kitchen:itemReady', (data: { orderId: string; itemId: string }) => {
      io.to('waitstaff').emit('kitchen:itemReady', data);
      logger.debug('Kitchen item ready', data);
    });

    socket.on('kitchen:orderReady', (data: { orderId: string }) => {
      io.to('waitstaff').emit('kitchen:orderReady', data);
      logger.debug('Kitchen order ready', data);
    });

    socket.on('kitchen:orderDelayed', (data: { orderId: string; estimatedMinutes: number }) => {
      if (data.orderId) {
        io.to('waitstaff').emit('kitchen:orderDelayed', data);
      }
    });

    // ─── Table events ────────────────────────────────────────────
    socket.on('table:request', (data: { tableId: string; restaurantId: string; type: string }) => {
      io.to('waitstaff').to(`restaurant:${data.restaurantId}`).emit('table:request', {
        ...data,
        timestamp: new Date(),
      });
    });

    socket.on('table:cleared', (data: { tableId: string }) => {
      io.to('tables').emit('tableStatusChanged', { tableId: data.tableId, status: 'available' });
    });

    // ─── Waitstaff events ────────────────────────────────────────
    socket.on('waiter:acknowledge', (data: { tableId: string; waiterId: string }) => {
      io.to('tables').emit('waiter:onWay', data);
    });

    // ─── Reservation events ──────────────────────────────────────
    socket.on('reservation:checkin', (data: { reservationId: string; tableId: string }) => {
      io.to('admin').to('host').emit('reservation:checkin', {
        ...data,
        timestamp: new Date(),
      });
    });

    // ─── Chat / support events (admin ↔ customer) ────────────────
    socket.on('chat:message', (data: { to: string; message: string; from: string }) => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });
      io.to(`user:${data.to}`).emit('chat:message', {
        from: data.from,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // ─── Presence ────────────────────────────────────────────────
    if (user?.userId) {
      io.to('admin').emit('staff:online', { userId: user.userId, role: user.role });

      socket.on('disconnect', () => {
        io.to('admin').emit('staff:offline', { userId: user.userId });
      });
    }
  });
}
