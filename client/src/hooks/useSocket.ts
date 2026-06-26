import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, joinOrderTracking } from '@/lib/socket';
import { useAuth } from './useAuth';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    socketRef.current = connectSocket();
    return () => { disconnectSocket(); };
  }, [isAuthenticated]);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinOrder = useCallback((orderId: string) => {
    joinOrderTracking(orderId);
  }, []);

  const join = useCallback((room: string) => {
    socketRef.current?.emit(`join:${room}`);
  }, []);

  const leave = useCallback((room: string) => {
    socketRef.current?.emit(`leave:${room}`);
  }, []);

  return { socket: socketRef.current, on, emit, join, joinOrder, leave };
}

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  const { on } = useSocket();
  useEffect(() => on<T>(event, handler), [on, event, handler]);
}
