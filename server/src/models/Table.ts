import mongoose, { Document, Schema } from 'mongoose';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface ITable {
  _id: string;
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: string;
  capacity: number;
  floor: number;
  section?: string;
  qrCode: string;
  status: TableStatus;
  position: { x: number; y: number };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableDocument extends Omit<ITable, '_id'>, Document {}

const tableSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    tableNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    floor: { type: Number, default: 1 },
    section: { type: String, trim: true },
    qrCode: { type: String, unique: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'] as TableStatus[],
      default: 'available',
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ restaurantId: 1, status: 1 });

tableSchema.pre('save', function (next) {
  if (this.isNew && !this.qrCode) {
    this.qrCode = `${this.restaurantId}-${this.tableNumber}-${Date.now()}`;
  }
  next();
});

export const Table = mongoose.model<ITableDocument>('Table', tableSchema);
