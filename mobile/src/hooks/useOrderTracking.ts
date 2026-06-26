import { useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, joinOrderTracking } from '../lib/socket';
import type { Socket } from 'socket.io-client';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'delivered' | 'cancelled';

interface TrackingState {
  status:        OrderStatus | null;
  orderNumber:   string | null;
  estimatedTime?: number;
  isConnected:   boolean;
  lastUpdated:   Date | null;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:          'Order Received',
  confirmed:        'Confirmed',
  preparing:        'Preparing',
  ready:            'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending:          'Waiting for restaurant to confirm your order',
  confirmed:        'Your order has been confirmed!',
  preparing:        'The kitchen is working on your order',
  ready:            'Your order is ready — head to the counter!',
  out_for_delivery: 'Your rider is on the way!',
  delivered:        'Enjoy your meal! 🍽',
  cancelled:        'Your order was cancelled',
};

export function useOrderTracking(orderId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<TrackingState>({
    status:      null,
    orderNumber: null,
    isConnected: false,
    lastUpdated: null,
  });

  useEffect(() => {
    if (!orderId) return;

    let mounted = true;

    (async () => {
      const socket = await connectSocket();
      if (!mounted) return;
      socketRef.current = socket;

      const handleConnect = async () => {
        if (!mounted) return;
        setState(s => ({ ...s, isConnected: true }));
        await joinOrderTracking(orderId);
      };

      const handleDisconnect = () => {
        if (!mounted) return;
        setState(s => ({ ...s, isConnected: false }));
      };

      const handleStatusUpdated = (payload: {
        orderId:       string;
        orderNumber:   string;
        status:        OrderStatus;
        estimatedTime?: number;
      }) => {
        if (!mounted || payload.orderId !== orderId) return;
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

      if (socket.connected) await handleConnect();
    })();

    return () => {
      mounted = false;
      socketRef.current?.off('connect');
      socketRef.current?.off('disconnect');
      socketRef.current?.off('order_status_updated');
    };
  }, [orderId]);

  return state;
}
