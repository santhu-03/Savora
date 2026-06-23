import mongoose, { Document, Schema } from 'mongoose';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded' | 'failed';
export type PaymentMethod = 'card' | 'cash' | 'wallet' | 'upi';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  modifiers: Array<{ name: string; value: string; price: number }>;
  specialInstructions?: string;
  status: ItemStatus;
}

export interface IOrder {
  _id: string;
  restaurantId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId;
  orderNumber: string;
  type: OrderType;
  items: IOrderItem[];
  status: OrderStatus;
  kitchenStatus: 'pending' | 'acknowledged' | 'preparing' | 'done';
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryAddress?: {
    street: string;
    city: string;
    lat?: number;
    lng?: number;
    instructions?: string;
  };
  estimatedTime?: number;
  actualTime?: number;
  stripePaymentIntentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {}

const orderItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    modifiers: [
      {
        name: String,
        value: String,
        price: { type: Number, default: 0 },
        _id: false,
      },
    ],
    specialInstructions: { type: String, maxlength: 300 },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'] as ItemStatus[],
      default: 'pending',
    },
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    orderNumber: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'] as OrderType[],
      required: true,
    },
    items: { type: [orderItemSchema], required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'] as OrderStatus[],
      default: 'pending',
    },
    kitchenStatus: {
      type: String,
      enum: ['pending', 'acknowledged', 'preparing', 'done'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partial', 'refunded', 'failed'] as PaymentStatus[],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'wallet', 'upi'] as PaymentMethod[],
    },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    serviceCharge: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    deliveryAddress: {
      street: String,
      city: String,
      lat: Number,
      lng: Number,
      instructions: String,
    },
    estimatedTime: Number,
    actualTime: Number,
    stripePaymentIntentId: { type: String, index: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ tableId: 1, status: 1 });

// Auto-generate orderNumber per restaurant: REST-YYYYMMDD-XXXX
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await (this.constructor as mongoose.Model<IOrderDocument>).countDocuments({
    restaurantId: this.restaurantId,
    orderNumber: new RegExp(`^${prefix}`),
  });
  this.orderNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  next();
});

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
