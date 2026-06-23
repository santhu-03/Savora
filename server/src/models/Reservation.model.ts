import mongoose, { Document, Schema, Model } from 'mongoose';
import { IReservation, ReservationStatus, ReservationSource, OccasionType } from '../types';

export interface IReservationDocument extends Omit<IReservation, '_id'>, Document {}
type IReservationModel = Model<IReservationDocument>;

const RES_STATUSES: ReservationStatus[] = ['pending','confirmed','waitlisted','seated','completed','cancelled','no_show','late'];
const RES_SOURCES: ReservationSource[] = ['website','app','phone','walk_in','third_party'];
const OCCASIONS: OccasionType[] = ['birthday','anniversary','business','proposal','graduation','other'];

const reservationSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    endTime: { type: String },
    duration: { type: Number, default: 90 },
    partySize: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0 },
    status: { type: String, enum: RES_STATUSES, default: 'pending', index: true },
    source: { type: String, enum: RES_SOURCES, default: 'website' },
    confirmationCode: { type: String, unique: true, index: true },
    specialRequests: { type: String, maxlength: 500 },
    occasion: { type: String, enum: OCCASIONS },
    occasionNote: { type: String, maxlength: 200 },
    dietaryRequirements: { type: String },
    seatingPreference: { type: String, enum: ['indoor','outdoor','bar','private'] },
    depositAmount: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    depositPaymentId: { type: String },
    remindersSent: { type: Number, default: 0 },
    lastReminderAt: { type: Date },
    checkedInAt: { type: Date },
    seatedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    internalNotes: { type: String },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurant: 1, date: 1, status: 1 });
reservationSchema.index({ 'guestInfo.email': 1 });

// Auto-generate confirmation code
reservationSchema.pre('validate', function (next) {
  if (this.isNew && !this.confirmationCode) {
    this.confirmationCode = `SVR${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  next();
});

export const Reservation = mongoose.model<IReservationDocument, IReservationModel>('Reservation', reservationSchema);
