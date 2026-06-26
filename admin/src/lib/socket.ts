import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

function getToken(): string {
  try {
    const raw = localStorage.getItem('savora_admin_auth');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? parsed?.token ?? '';
  } catch {
    return '';
  }
}

export function getSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token: getToken() },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  // Refresh auth token on each (re)connect
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinRestaurant(restaurantId: string): void {
  getSocket().emit('join_restaurant', { restaurantId });
}

export function joinKitchen(restaurantId: string): void {
  getSocket().emit('join_kitchen', { restaurantId });
}
