import mongoose, { Document, Schema } from 'mongoose';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app';
export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_ready'
  | 'order_cancelled'
  | 'payment_received'
  | 'reservation_confirmed'
  | 'reservation_reminder'
  | 'reservation_cancelled'
  | 'loyalty_points'
  | 'low_stock'
  | 'staff_alert'
  | 'promotional'
  | 'system';

export interface INotification {
  _id: string;
  userId: mongoose.Types.ObjectId;
  restaurantId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  channel: NotificationChannel;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    type: {
      type: String,
      enum: [
        'order_placed', 'order_confirmed', 'order_ready', 'order_cancelled',
        'payment_received', 'reservation_confirmed', 'reservation_reminder',
        'reservation_cancelled', 'loyalty_points', 'low_stock', 'staff_alert',
        'promotional', 'system',
      ] as NotificationType[],
      required: true,
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in-app'] as NotificationChannel[],
      default: 'in-app',
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
