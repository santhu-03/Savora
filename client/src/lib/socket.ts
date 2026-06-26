import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './api';

const SERVER_URL = import.meta.env.VITE_API_URL ?? '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL || '/', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token: tokenStorage.get() ?? '' },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  s.auth = { token: tokenStorage.get() ?? '' };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinOrderTracking(orderId: string): void {
  getSocket().emit('join_order_tracking', { orderId });
}

export function joinRestaurant(restaurantId: string): void {
  getSocket().emit('join_restaurant', { restaurantId });
}

// Legacy helpers kept for backward compat
export function joinRoom(room: string): void {
  getSocket().emit(`join:${room}`);
}
export function leaveRoom(room: string): void {
  getSocket().emit(`leave:${room}`);
}
