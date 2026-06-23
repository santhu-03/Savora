import mongoose, { Document, Schema, Model } from 'mongoose';
import { IReview, ReviewSentiment, ReviewSource } from '../types';

export interface IReviewDocument extends Omit<IReview, '_id'>, Document {}
type IReviewModel = Model<IReviewDocument>;

const reviewSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    foodRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    ambianceRating: { type: Number, min: 1, max: 5 },
    valueRating: { type: Number, min: 1, max: 5 },
    title: { type: String, maxlength: 100 },
    comment: { type: String, maxlength: 2000 },
    images: [{ type: String }],
    tags: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    response: {
      text: { type: String },
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      respondedAt: { type: Date },
    },
    source: { type: String, enum: ['in_app','google','zomato','swiggy'] as ReviewSource[], default: 'in_app' },
    sentiment: { type: String, enum: ['positive','neutral','negative'] as ReviewSentiment[] },
  },
  { timestamps: true }
);

reviewSchema.index({ restaurant: 1, isPublished: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, restaurant: 1 }, { unique: true });

export const Review = mongoose.model<IReviewDocument, IReviewModel>('Review', reviewSchema);
