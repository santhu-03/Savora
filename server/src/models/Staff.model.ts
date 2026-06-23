import mongoose, { Document, Schema, Model } from 'mongoose';
import { IStaff, StaffRole, ShiftType } from '../types';

export interface IStaffDocument extends Omit<IStaff, '_id'>, Document {}
type IStaffModel = Model<IStaffDocument>;

const STAFF_ROLES: StaffRole[] = ['chef','sous_chef','line_cook','waiter','host','bartender','manager','cashier','delivery','cleaner'];
const SHIFT_TYPES: ShiftType[] = ['morning','afternoon','evening','night','split'];

const shiftSchema = new Schema(
  {
    date: { type: Date, required: true },
    type: { type: String, enum: SHIFT_TYPES, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    actualStartTime: String,
    actualEndTime: String,
    hoursWorked: Number,
    station: String,
    notes: String,
    isAbsent: { type: Boolean, default: false },
    absenceReason: String,
  },
  { _id: false }
);

const staffSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    employeeId: { type: String, required: true },
    role: { type: String, enum: STAFF_ROLES, required: true },
    department: { type: String, required: true },
    joinDate: { type: Date, required: true },
    salary: { type: Number, required: true, min: 0 },
    salaryType: { type: String, enum: ['hourly','daily','monthly'], default: 'monthly' },
    shifts: [shiftSchema],
    isOnDuty: { type: Boolean, default: false },
    permissions: [{ type: String }],
    performance: {
      averageRating: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalShifts: { type: Number, default: 0 },
      attendanceRate: { type: Number, default: 100 },
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    documents: [
      {
        type: String,
        url: String,
        expiryDate: Date,
      },
    ],
    isActive: { type: Boolean, default: true },
    terminatedAt: Date,
    terminationReason: String,
  },
  { timestamps: true }
);

staffSchema.index({ restaurant: 1, employeeId: 1 }, { unique: true });
staffSchema.index({ restaurant: 1, role: 1, isActive: 1 });

export const Staff = (mongoose.models['Staff'] as IStaffModel) || mongoose.model<IStaffDocument, IStaffModel>('Staff', staffSchema);
