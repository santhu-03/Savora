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

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.debug('Socket connected', { socketId: socket.id, userId: user?.userId });

    // Join user-specific room
    if (user?.userId) socket.join(`user:${user.userId}`);

    socket.on('join:restaurant', (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
    });

    socket.on('join:kitchen', () => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });
      socket.join('kitchen');
    });

    socket.on('join:tables', () => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });
      socket.join('tables');
    });

    socket.on('join:waitstaff', () => {
      if (!user) return socket.emit('error', { message: 'Unauthorized' });
      socket.join('waitstaff');
    });

    socket.on('join:admin', () => {
      if (!user || !['admin', 'manager', 'super_admin'].includes(user.role)) {
        return socket.emit('error', { message: 'Unauthorized' });
      }
      socket.join('admin');
    });

    socket.on('disconnect', reason => {
      logger.debug('Socket disconnected', { socketId: socket.id, reason });
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}
