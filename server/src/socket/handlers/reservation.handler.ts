import { Server as SocketServer, Socket } from 'socket.io';
import { Reservation } from '../../models/Reservation';
import { Table } from '../../models/Table';
import { logger } from '../../utils/logger';
import { EVENT, room } from '../events';

export function registerReservationHandler(io: SocketServer, socket: Socket): void {
  const user = socket.data.user;

  /**
   * Host checks in an arriving party.
   * Updates reservation → seated, assigns table if provided,
   * broadcasts to the restaurant room so other screens update.
   */
  socket.on(
    'reservation:checkin',
    async ({
      reservationId,
      tableId,
      restaurantId,
    }: {
      reservationId: string;
      tableId?:      string;
      restaurantId:  string;
    }) => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });

      try {
        const updates: Record<string, unknown> = { status: 'seated' };
        if (tableId) updates.tableId = tableId;

        const reservation = await Reservation.findByIdAndUpdate(
          reservationId,
          updates,
          { new: true }
        ).populate('tableId', 'tableNumber section');

        if (!reservation) return;

        // Mark table as occupied
        if (tableId) {
          await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
          io.to(room.restaurant(restaurantId)).emit(EVENT.TABLE_STATUS_CHANGED, {
            tableId,
            tableNumber: (reservation.tableId as any)?.tableNumber ?? '',
            status: 'occupied',
          });
        }

        io.to(room.restaurant(restaurantId)).emit(EVENT.RESERVATION_STATUS_CHANGED, {
          reservationId,
          status:      'seated',
          tableId:     tableId,
          tableNumber: (reservation.tableId as any)?.tableNumber,
          customerName:(reservation as any).customerName ?? '',
        });

        socket.emit('reservation:checkin:ack', { success: true, reservationId });
        logger.info('Reservation checked in', { reservationId, tableId });
      } catch (err) {
        logger.error('reservation:checkin failed', { reservationId, err });
        socket.emit('error', { message: 'Check-in failed' });
      }
    }
  );

  /**
   * Customer / host request a table service.
   */
  socket.on(
    'table:request',
    ({
      tableId,
      restaurantId,
      type,
    }: {
      tableId:      string;
      restaurantId: string;
      type:         'waiter' | 'bill' | 'water';
    }) => {
      io.to(room.restaurant(restaurantId)).emit('table:request', {
        tableId,
        type,
        timestamp: new Date().toISOString(),
      });
    }
  );
}
