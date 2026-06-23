import mongoose, { Document, Schema, Model } from 'mongoose';
import { IRestaurant, DayOfWeek } from '../types';

export interface IRestaurantDocument extends Omit<IRestaurant, '_id'>, Document {}
type IRestaurantModel = Model<IRestaurantDocument>;

const operatingHoursSchema = new Schema(
  {
    day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as DayOfWeek[], required: true },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '22:00' },
    isClosed: { type: Boolean, default: false },
    breaks: [{ start: String, end: String, _id: false }],
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    requireDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 },
    maxAdvanceBookingDays: { type: Number, default: 30 },
    minPartySize: { type: Number, default: 1 },
    maxPartySize: { type: Number, default: 12 },
    autoConfirmReservations: { type: Boolean, default: true },
    allowOnlineOrdering: { type: Boolean, default: true },
    allowDelivery: { type: Boolean, default: false },
    deliveryRadius: { type: Number, default: 5 },
    deliveryFee: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number, default: 0 },
  },
  { _id: false }
);

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String },
    logo: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
    cuisine: [{ type: String }],
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      coordinates: { lat: { type: Number }, lng: { type: Number } },
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      website: { type: String },
    },
    operatingHours: { type: [operatingHoursSchema], default: [] },
    totalSeats: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    priceRange: { type: Number, enum: [1, 2, 3, 4], default: 2 },
    taxRate: { type: Number, default: 0.05 },
    serviceChargeRate: { type: Number, default: 0.1 },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    isActive: { type: Boolean, default: true },
    stripeAccountId: { type: String },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Restaurant = (mongoose.models['Restaurant'] as IRestaurantModel) || mongoose.model<IRestaurantDocument, IRestaurantModel>('Restaurant', restaurantSchema);
