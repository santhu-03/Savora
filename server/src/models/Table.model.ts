import mongoose, { Document, Schema, Model } from 'mongoose';
import { ITable, TableStatus, TableShape, TableFeature } from '../types';

export interface ITableDocument extends Omit<ITable, '_id'>, Document {}
type ITableModel = Model<ITableDocument>;

const tableSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    number: { type: String, required: true },
    displayName: { type: String },
    section: { type: String, default: 'Main' },
    floor: { type: Number, default: 1 },
    shape: { type: String, enum: ['round','square','rectangle','oval'] as TableShape[], default: 'round' },
    minCapacity: { type: Number, default: 1, min: 1 },
    maxCapacity: { type: Number, required: true, min: 1 },
    isJoinable: { type: Boolean, default: false },
    joinableWith: [{ type: Schema.Types.ObjectId, ref: 'Table' }],
    position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    status: { type: String, enum: ['available','occupied','reserved','maintenance','cleaning'] as TableStatus[], default: 'available', index: true },
    currentOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
    currentReservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    qrCode: { type: String },
    qrCodeUrl: { type: String },
    features: { type: [String], enum: ['window','outdoor','private','accessible','booth','bar'] as TableFeature[], default: [] },
    isActive: { type: Boolean, default: true },
    lastStatusChange: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

tableSchema.index({ restaurant: 1, number: 1 }, { unique: true });
tableSchema.index({ restaurant: 1, status: 1 });

export const Table = (mongoose.models['Table'] as ITableModel) || mongoose.model<ITableDocument, ITableModel>('Table', tableSchema);
