import mongoose, { Document, Schema, Model } from 'mongoose';
import { IOrder, OrderStatus, OrderType, PaymentStatus, PaymentMethod, ItemStatus } from '../types';

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {}
type IOrderModel = Model<IOrderDocument>;

const orderItemSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    modifications: [
      {
        modifierName: String,
        optionName: String,
        priceAdjustment: { type: Number, default: 0 },
        _id: false,
      },
    ],
    notes: { type: String, maxlength: 300 },
    status: { type: String, enum: ['pending','preparing','ready','served','cancelled'] as ItemStatus[], default: 'pending' },
    preparedAt: Date,
    servedAt: Date,
  },
  { _id: true }
);

const ORDER_STATUSES: OrderStatus[] = ['draft','pending','confirmed','preparing','ready','served','completed','cancelled','refunded'];
const ORDER_TYPES: OrderType[] = ['dine_in','takeaway','delivery','room_service'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid','partially_paid','paid','refunded','failed'];

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestInfo: {
      name: String,
      email: String,
      phone: String,
    },
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'User' },
    items: { type: [orderItemSchema], required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    type: { type: String, enum: ORDER_TYPES, default: 'dine_in' },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    discountCode: { type: String },
    taxAmount: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },
    paymentMethod: { type: String, enum: ['card','cash','upi','wallet'] as PaymentMethod[] },
    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    receiptUrl: { type: String },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: { type: Number },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    deliveryAddress: {
      street: String,
      city: String,
      pincode: String,
      instructions: String,
    },
    notes: { type: String, maxlength: 500 },
    kitchenNotes: { type: String, maxlength: 500 },
    priority: { type: String, enum: ['normal','high','urgent'], default: 'normal' },
    placedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, status: 1, placedAt: -1 });
orderSchema.index({ customer: 1, placedAt: -1 });
orderSchema.index({ table: 1, status: 1 });

// Auto-generate order number
orderSchema.pre('validate', function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 5).toUpperCase();
    this.orderNumber = `SVR-${timestamp}-${random}`;
  }
  next();
});

export const Order = (mongoose.models['Order'] as IOrderModel) || mongoose.model<IOrderDocument, IOrderModel>('Order', orderSchema);
