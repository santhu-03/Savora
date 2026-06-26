import { useEffect, useState, useCallback } from 'react';
import { connectSocket, joinOrderTracking } from '@/lib/socket';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'delivered' | 'cancelled';

interface TrackingState {
  status:        OrderStatus | null;
  orderNumber:   string | null;
  estimatedTime?: number;
  lastUpdated:   Date | null;
  isConnected:   boolean;
}

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending:          'Order received — waiting for confirmation',
  confirmed:        'Your order has been confirmed!',
  preparing:        'The kitchen is preparing your order',
  ready:            'Your order is ready!',
  out_for_delivery: 'Your order is on the way!',
  delivered:        'Order delivered. Enjoy your meal!',
  cancelled:        'Your order has been cancelled',
};

export function useOrderTracking(orderId: string | null | undefined) {
  const [state, setState] = useState<TrackingState>({
    status:      null,
    orderNumber: null,
    isConnected: false,
    lastUpdated: null,
  });

  useEffect(() => {
    if (!orderId) return;

    const socket = connectSocket();

    const handleConnect = () => {
      setState(s => ({ ...s, isConnected: true }));
      joinOrderTracking(orderId);
    };

    const handleDisconnect = () => {
      setState(s => ({ ...s, isConnected: false }));
    };

    const handleStatusUpdated = (payload: {
      orderId:       string;
      orderNumber:   string;
      status:        OrderStatus;
      estimatedTime?: number;
    }) => {
      if (payload.orderId !== orderId) return;
      setState(s => ({
        ...s,
        status:        payload.status,
        orderNumber:   payload.orderNumber,
        estimatedTime: payload.estimatedTime,
        lastUpdated:   new Date(),
      }));
    };

    socket.on('connect',              handleConnect);
    socket.on('disconnect',           handleDisconnect);
    socket.on('order_status_updated', handleStatusUpdated);

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect',              handleConnect);
      socket.off('disconnect',           handleDisconnect);
      socket.off('order_status_updated', handleStatusUpdated);
    };
  }, [orderId]);

  const getStatusMessage = useCallback((status: OrderStatus) => {
    return STATUS_MESSAGES[status] ?? '';
  }, []);

  return { ...state, getStatusMessage };
}
