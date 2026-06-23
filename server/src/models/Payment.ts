import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethodType = 'card' | 'cash' | 'wallet' | 'upi';
export type PaymentStatusType = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface IPayment {
  _id: string;
  orderId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  status: PaymentStatusType;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument extends Omit<IPayment, '_id'>, Document {}

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    method: {
      type: String,
      enum: ['card', 'cash', 'wallet', 'upi'] as PaymentMethodType[],
      required: true,
    },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    stripeChargeId: { type: String, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'] as PaymentStatusType[],
      default: 'pending',
    },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 }, { unique: true });

export const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);
