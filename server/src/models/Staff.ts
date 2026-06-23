import mongoose, { Document, Schema } from 'mongoose';

export type StaffRole = 'kitchen' | 'waiter' | 'cashier' | 'host' | 'manager' | 'delivery' | 'cleaner';
export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IStaff {
  _id: string;
  restaurantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: StaffRole;
  department?: string;
  shift: ShiftType;
  salary?: number;
  joiningDate: Date;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaffDocument extends Omit<IStaff, '_id'>, Document {}

const staffSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['kitchen', 'waiter', 'cashier', 'host', 'manager', 'delivery', 'cleaner'] as StaffRole[],
      required: true,
    },
    department: { type: String, trim: true },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'] as ShiftType[],
      required: true,
    },
    salary: { type: Number, min: 0 },
    joiningDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

staffSchema.index({ restaurantId: 1, userId: 1 }, { unique: true });
staffSchema.index({ restaurantId: 1, role: 1, isActive: 1 });

export const Staff = mongoose.model<IStaffDocument>('Staff', staffSchema);
