import mongoose, { Document, Schema } from 'mongoose';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';

export interface ILoyaltyHistory {
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  orderId?: mongoose.Types.ObjectId;
  date: Date;
}

export interface ILoyalty {
  _id: string;
  customerId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  points: number;
  tier: LoyaltyTier;
  history: ILoyaltyHistory[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoyaltyDocument extends Omit<ILoyalty, '_id'>, Document {}

const TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 };

const historySchema = new Schema(
  {
    type: {
      type: String,
      enum: ['earn', 'redeem', 'expire', 'bonus', 'adjustment'] as LoyaltyTransactionType[],
      required: true,
    },
    points: { type: Number, required: true },
    description: { type: String, required: true, maxlength: 200 },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const loyaltySchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    points: { type: Number, default: 0, min: 0 },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'] as LoyaltyTier[],
      default: 'bronze',
    },
    history: { type: [historySchema], default: [] },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

loyaltySchema.index({ customerId: 1, restaurantId: 1 }, { unique: true });

// Auto-update tier on points change
loyaltySchema.pre('save', function (next) {
  if (!this.isModified('points')) return next();
  const pts = this.points as number;
  if (pts >= TIER_THRESHOLDS.platinum) this.tier = 'platinum';
  else if (pts >= TIER_THRESHOLDS.gold) this.tier = 'gold';
  else if (pts >= TIER_THRESHOLDS.silver) this.tier = 'silver';
  else this.tier = 'bronze';
  next();
});

export const Loyalty = mongoose.model<ILoyaltyDocument>('Loyalty', loyaltySchema);
