import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

async function getToken(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync('auth_token')) ?? '';
  } catch {
    return '';
  }
}

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await getToken();

  socket = io(SERVER_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export async function connectSocket(): Promise<Socket> {
  const s = await getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export async function joinOrderTracking(orderId: string): Promise<void> {
  const s = await getSocket();
  s.emit('join_order_tracking', { orderId });
}

export async function joinRestaurant(restaurantId: string): Promise<void> {
  const s = await getSocket();
  s.emit('join_restaurant', { restaurantId });
}
