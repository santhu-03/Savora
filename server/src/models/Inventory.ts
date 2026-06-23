import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'purchase' | 'usage' | 'waste' | 'adjustment' | 'return';

export interface IInventoryTransaction {
  type: TransactionType;
  quantity: number;
  note?: string;
  date: Date;
  userId: mongoose.Types.ObjectId;
}

export interface IInventory {
  _id: string;
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  costPerUnit: number;
  supplierId?: string;
  category: string;
  transactions: IInventoryTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryDocument extends Omit<IInventory, '_id'>, Document {
  isLow: boolean;
}

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['purchase', 'usage', 'waste', 'adjustment', 'return'] as TransactionType[],
      required: true,
    },
    quantity: { type: Number, required: true },
    note: { type: String, maxlength: 300 },
    date: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const inventorySchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minThreshold: { type: Number, required: true, min: 0 },
    costPerUnit: { type: Number, required: true, min: 0 },
    supplierId: { type: String },
    category: { type: String, required: true },
    transactions: { type: [transactionSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventorySchema.index({ restaurantId: 1, category: 1 });
inventorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

// Virtual: isLow
inventorySchema.virtual('isLow').get(function (this: IInventoryDocument) {
  return this.quantity <= this.minThreshold;
});

export const Inventory = mongoose.model<IInventoryDocument>('Inventory', inventorySchema);
