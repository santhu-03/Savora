import mongoose, { Document, Schema, Model } from 'mongoose';
import { INotification, NotificationType, NotificationChannel, NotificationStatus, NotificationPriority } from '../types';

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}
type INotificationModel = Model<INotificationDocument>;

const TYPES: NotificationType[] = [
  'order_placed','order_confirmed','order_preparing','order_ready','order_served','order_cancelled',
  'payment_received','payment_failed','reservation_confirmed','reservation_reminder','reservation_cancelled',
  'table_ready','review_received','loyalty_points','promotional','system','low_stock','staff_alert',
];

const notificationSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true, maxlength: 100 },
    body: { type: String, required: true, maxlength: 500 },
    data: { type: Schema.Types.Mixed },
    channels: { type: [String], enum: ['in_app','email','sms','push'] as NotificationChannel[], default: ['in_app'] },
    status: { type: String, enum: ['pending','sent','delivered','read','failed'] as NotificationStatus[], default: 'pending' },
    readAt: Date,
    sentAt: Date,
    errorMessage: String,
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
    actionUrl: String,
    imageUrl: String,
    priority: { type: String, enum: ['low','normal','high','urgent'] as NotificationPriority[], default: 'normal' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });

export const Notification = mongoose.model<INotificationDocument, INotificationModel>('Notification', notificationSchema);
