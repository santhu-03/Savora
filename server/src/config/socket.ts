import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { env } from './env';

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [env.clientUrl, env.adminUrl],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token ?? socket.handshake.headers['authorization']?.replace('Bearer ', '');
    if (!token) return next(); // allow unauthenticated for public channels
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}
