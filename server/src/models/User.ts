import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type UserRole = 'customer' | 'staff' | 'kitchen' | 'manager' | 'admin' | 'super_admin';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface IAddress {
  label: string;
  street: string;
  city: string;
  lat?: number;
  lng?: number;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  restaurantId?: mongoose.Types.ObjectId;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  addresses: IAddress[];
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  // Email verification
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  // Password reset
  passwordResetOtp?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidate: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetOtp(): string;
}

const addressSchema = new Schema(
  {
    label: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['customer', 'staff', 'kitchen', 'manager', 'admin', 'super_admin'] as UserRole[],
      default: 'customer',
    },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'] as LoyaltyTier[],
      default: 'bronze',
    },
    addresses: { type: [addressSchema], default: [] },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    // Hashed verification token
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    // Hashed OTP for password reset
    passwordResetOtp: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// email unique index is already created by `unique: true` in schema definition
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ restaurantId: 1, role: 1 });

// Hash password on create/change
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password as string, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Returns raw token (send to user) — stores SHA-256 hash
userSchema.methods.generateEmailVerificationToken = function (): string {
  const raw = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return raw;
};

// Returns raw OTP (send to user) — stores SHA-256 hash
userSchema.methods.generatePasswordResetOtp = function (): string {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  this.passwordResetOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return otp;
};

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret['password'];
    delete ret['refreshToken'];
    delete ret['emailVerificationToken'];
    delete ret['emailVerificationExpires'];
    delete ret['passwordResetOtp'];
    delete ret['passwordResetExpires'];
    delete ret['__v'];
    return ret;
  },
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
