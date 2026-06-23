import mongoose, { Document, Schema, Model } from 'mongoose';
import { IMenu, MenuType, MenuStatus, DayOfWeek } from '../types';

export interface IMenuDocument extends Omit<IMenu, '_id'>, Document {}
type IMenuModel = Model<IMenuDocument>;

const menuSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['main','breakfast','lunch','dinner','brunch','drinks','dessert','seasonal','special'] as MenuType[],
      default: 'main',
    },
    status: { type: String, enum: ['active','inactive','seasonal','scheduled'] as MenuStatus[], default: 'active' },
    availableFrom: { type: String },
    availableUntil: { type: String },
    availableDays: {
      type: [String],
      enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as DayOfWeek[],
      default: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
    },
    categories: [
      {
        name: { type: String, required: true },
        description: { type: String },
        sortOrder: { type: Number, default: 0 },
        image: { type: String },
      },
    ],
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

menuSchema.index({ restaurant: 1, status: 1 });
menuSchema.index({ restaurant: 1, isDefault: 1 });

export const Menu = mongoose.model<IMenuDocument, IMenuModel>('Menu', menuSchema);
