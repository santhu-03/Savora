import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOpeningHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IRestaurant {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  images: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    lat?: number;
    lng?: number;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  cuisine: string[];
  openingHours: IOpeningHour[];
  settings: {
    taxRate: number;
    serviceCharge: number;
    currency: string;
    timezone: string;
  };
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'trial' | 'expired';
    expiresAt?: Date;
  };
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestaurantDocument extends Omit<IRestaurant, '_id'>, Document {}

const openingHourSchema = new Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '22:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 1000 },
    logo: String,
    coverImage: String,
    images: [{ type: String }],
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      lat: Number,
      lng: Number,
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      website: String,
    },
    cuisine: [{ type: String }],
    openingHours: { type: [openingHourSchema], default: [] },
    settings: {
      taxRate: { type: Number, default: 5, min: 0, max: 100 },
      serviceCharge: { type: Number, default: 10, min: 0, max: 100 },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    subscription: {
      plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
      status: { type: String, enum: ['active', 'inactive', 'trial', 'expired'], default: 'trial' },
      expiresAt: Date,
    },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ isActive: 1, rating: -1 });
restaurantSchema.index({ 'address.city': 1 });

restaurantSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug && this.name) {
    this.slug = (this.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

export const Restaurant = mongoose.model<IRestaurantDocument>('Restaurant', restaurantSchema);
