import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser, UserRole, UserStatus, LoyaltyTier } from '../types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidate: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
}

type IUserModel = Model<IUserDocument>;

const preferencesSchema = new Schema(
  {
    dietary: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    seatingPreference: { type: String, enum: ['indoor', 'outdoor', 'bar', 'private'] },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, sparse: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'staff', 'chef', 'manager', 'admin', 'super_admin'] as UserRole[], default: 'customer' },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending_verification'] as UserStatus[], default: 'pending_verification' },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokens: { type: [String], select: false, default: [] },
    tokenVersion: { type: Number, default: 0, select: false },
    preferences: { type: preferencesSchema, default: () => ({}) },
    loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] as LoyaltyTier[], default: 'bronze' },
    totalSpent: { type: Number, default: 0, min: 0 },
    visitCount: { type: Number, default: 0, min: 0 },
    lastVisit: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret['passwordHash'];
        delete ret['refreshTokens'];
        delete ret['tokenVersion'];
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
userSchema.index({ role: 1, status: 1 });
userSchema.index({ loyaltyTier: 1 });

// ─── Hooks ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.generateEmailVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

userSchema.methods.generatePasswordResetToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return token;
};

export const User = (mongoose.models['User'] as IUserModel) || mongoose.model<IUserDocument, IUserModel>('User', userSchema);
