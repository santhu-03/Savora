import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface IReservation {
  _id: string;
  restaurantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: string;
  partySize: number;
  duration: number;
  status: ReservationStatus;
  specialRequests?: string;
  notes?: string;
  reminderSent: boolean;
  confirmationCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservationDocument extends Omit<IReservation, '_id'>, Document {}

const reservationSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1 },
    duration: { type: Number, default: 90, min: 15 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as ReservationStatus[],
      default: 'pending',
    },
    specialRequests: { type: String, maxlength: 500 },
    notes: { type: String, maxlength: 500 },
    reminderSent: { type: Boolean, default: false },
    confirmationCode: { type: String, unique: true },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurantId: 1, date: 1, status: 1 });
reservationSchema.index({ restaurantId: 1, tableId: 1, date: 1 });
reservationSchema.index({ customerId: 1, date: -1 });

reservationSchema.pre('save', function (next) {
  if (this.isNew && !this.confirmationCode) {
    this.confirmationCode = 'SVR' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  next();
});

export const Reservation = mongoose.model<IReservationDocument>('Reservation', reservationSchema);
