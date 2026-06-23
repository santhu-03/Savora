import { Notification } from '../models/Notification.model';
import { AppError } from '../middleware/errorHandler';
import { parsePagination, buildMeta } from '../utils/pagination';
import { getIO } from '../config/socket';
import { NotificationType, NotificationChannel, NotificationPriority } from '../types';
import { logger } from '../utils/logger';

interface CreateNotificationDto {
  restaurantId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
}

export class NotificationService {
  static async create(dto: CreateNotificationDto) {
    const notification = await Notification.create({
      restaurant: dto.restaurantId,
      recipient: dto.recipientId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      channels: dto.channels ?? ['in_app'],
      priority: dto.priority ?? 'normal',
      actionUrl: dto.actionUrl,
      expiresAt: dto.expiresAt,
    });

    // Deliver in-app via socket
    if (notification.channels.includes('in_app')) {
      getIO()?.to(`user:${dto.recipientId}`).emit('notification', notification);
    }

    logger.info('Notification created', { type: dto.type, recipient: dto.recipientId });
    return notification;
  }

  static async findForUser(userId: string, query: Record<string, string>) {
    const { page, limit, skip, sort } = parsePagination({ ...query, sortBy: 'createdAt', sortOrder: 'desc' });
    const filter: Record<string, unknown> = { recipient: userId };
    if (query.unread === 'true') filter.readAt = { $exists: false };

    const [data, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort(sort).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, readAt: { $exists: false } }),
    ]);

    return { data, pagination: buildMeta(total, page, limit), unreadCount };
  }

  static async markRead(notificationId: string, userId: string) {
    const n = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { readAt: new Date(), status: 'read' } },
      { new: true }
    );
    if (!n) throw new AppError('Notification not found', 404);
    return n;
  }

  static async markAllRead(userId: string) {
    await Notification.updateMany(
      { recipient: userId, readAt: { $exists: false } },
      { $set: { readAt: new Date(), status: 'read' } }
    );
  }

  static async delete(notificationId: string, userId: string) {
    const n = await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
    if (!n) throw new AppError('Notification not found', 404);
  }
}
