import mongoose, { Document, Schema, Model } from 'mongoose';
import { ILoyaltyPoints, LoyaltyTier, LoyaltyTransactionType } from '../types';

export interface ILoyaltyPointsDocument extends Omit<ILoyaltyPoints, '_id'>, Document {}
type ILoyaltyPointsModel = Model<ILoyaltyPointsDocument>;

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 15000,
};

const transactionSchema = new Schema(
  {
    type: { type: String, enum: ['earn','redeem','expire','bonus','adjustment'] as LoyaltyTransactionType[], required: true },
    points: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    description: { type: String, required: true },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const loyaltySchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    currentPoints: { type: Number, default: 0, min: 0 },
    lifetimePoints: { type: Number, default: 0, min: 0 },
    redeemedPoints: { type: Number, default: 0, min: 0 },
    tier: { type: String, enum: ['bronze','silver','gold','platinum'] as LoyaltyTier[], default: 'bronze' },
    tierProgress: { type: Number, default: 0 },
    nextTierPoints: { type: Number, default: TIER_THRESHOLDS.silver },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

loyaltySchema.index({ customer: 1, restaurant: 1 }, { unique: true });

loyaltySchema.methods.recalculateTier = function () {
  const pts = this.lifetimePoints;
  if (pts >= TIER_THRESHOLDS.platinum) { this.tier = 'platinum'; this.nextTierPoints = 0; }
  else if (pts >= TIER_THRESHOLDS.gold) { this.tier = 'gold'; this.tierProgress = (pts - TIER_THRESHOLDS.gold) / (TIER_THRESHOLDS.platinum - TIER_THRESHOLDS.gold) * 100; this.nextTierPoints = TIER_THRESHOLDS.platinum; }
  else if (pts >= TIER_THRESHOLDS.silver) { this.tier = 'silver'; this.tierProgress = (pts - TIER_THRESHOLDS.silver) / (TIER_THRESHOLDS.gold - TIER_THRESHOLDS.silver) * 100; this.nextTierPoints = TIER_THRESHOLDS.gold; }
  else { this.tier = 'bronze'; this.tierProgress = pts / TIER_THRESHOLDS.silver * 100; this.nextTierPoints = TIER_THRESHOLDS.silver; }
};

export const LoyaltyPoints = mongoose.model<ILoyaltyPointsDocument, ILoyaltyPointsModel>('LoyaltyPoints', loyaltySchema);
