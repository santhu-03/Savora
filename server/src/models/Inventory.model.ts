import mongoose, { Document, Schema, Model } from 'mongoose';
import { IInventory, InventoryUnit, InventoryStatus, InventoryTransactionType } from '../types';

export interface IInventoryDocument extends Omit<IInventory, '_id'>, Document {}
type IInventoryModel = Model<IInventoryDocument>;

const UNITS: InventoryUnit[] = ['kg','g','l','ml','pcs','dozen','box','pack'];

const txnSchema = new Schema(
  {
    type: { type: String, enum: ['purchase','usage','waste','adjustment','return'] as InventoryTransactionType[], required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: UNITS, required: true },
    unitCost: Number,
    totalCost: Number,
    supplier: String,
    invoiceNumber: String,
    notes: String,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inventorySchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    unit: { type: String, enum: UNITS, required: true },
    currentStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    reorderQuantity: { type: Number, required: true, min: 1 },
    maxStock: { type: Number, required: true },
    unitCost: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, default: 0 },
    status: { type: String, enum: ['in_stock','low_stock','out_of_stock','discontinued'] as InventoryStatus[], default: 'in_stock' },
    supplier: {
      name: String,
      contact: String,
      email: { type: String, lowercase: true },
      leadTime: { type: Number, default: 1 },
    },
    linkedMenuItems: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
    transactions: [txnSchema],
    lastRestockedAt: Date,
    expiryDate: Date,
    storageLocation: String,
  },
  { timestamps: true }
);

inventorySchema.index({ restaurant: 1, sku: 1 }, { unique: true });
inventorySchema.index({ restaurant: 1, status: 1 });

// Auto-update status on stock changes
inventorySchema.pre('save', function (this: IInventoryDocument, next) {
  this.totalValue = this.currentStock * this.unitCost;
  if (this.currentStock <= 0) this.status = 'out_of_stock';
  else if (this.currentStock <= this.reorderLevel) this.status = 'low_stock';
  else this.status = 'in_stock';
  next();
});

export const Inventory = (mongoose.models['Inventory'] as IInventoryModel) || mongoose.model<IInventoryDocument, IInventoryModel>('Inventory', inventorySchema);
