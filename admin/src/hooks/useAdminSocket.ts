import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, joinRestaurant } from '@/lib/socket';
import type {
  NewOrderPayload,
  OrderStatusUpdatedPayload,
  ReservationCreatedPayload,
  LowStockAlertPayload,
  NewReviewPayload,
  TableStatusChangedPayload,
} from '../../../server/src/socket/events';

export type {
  NewOrderPayload,
  OrderStatusUpdatedPayload,
  ReservationCreatedPayload,
  LowStockAlertPayload,
  NewReviewPayload,
  TableStatusChangedPayload,
};

interface AdminSocketOptions {
  restaurantId: string | undefined;
  onNewOrder?:            (payload: NewOrderPayload)            => void;
  onOrderStatusUpdated?:  (payload: OrderStatusUpdatedPayload)  => void;
  onReservationCreated?:  (payload: ReservationCreatedPayload)  => void;
  onLowStockAlert?:       (payload: LowStockAlertPayload)       => void;
  onNewReview?:           (payload: NewReviewPayload)           => void;
  onTableStatusChanged?:  (payload: TableStatusChangedPayload)  => void;
}

export function useAdminSocket({
  restaurantId,
  onNewOrder,
  onOrderStatusUpdated,
  onReservationCreated,
  onLowStockAlert,
  onNewReview,
  onTableStatusChanged,
}: AdminSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    const socket = connectSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      joinRestaurant(restaurantId);
    };

    socket.on('connect', handleConnect);
    if (socket.connected) handleConnect();

    if (onNewOrder)           socket.on('new_order',            onNewOrder);
    if (onOrderStatusUpdated) socket.on('order_status_updated', onOrderStatusUpdated);
    if (onReservationCreated) socket.on('reservation_created',  onReservationCreated);
    if (onLowStockAlert)      socket.on('low_stock_alert',      onLowStockAlert);
    if (onNewReview)          socket.on('new_review',           onNewReview);
    if (onTableStatusChanged) socket.on('table_status_changed', onTableStatusChanged);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_order');
      socket.off('order_status_updated');
      socket.off('reservation_created');
      socket.off('low_stock_alert');
      socket.off('new_review');
      socket.off('table_status_changed');
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, socket: socketRef.current };
}
