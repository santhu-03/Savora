import mongoose, { Document, Schema } from 'mongoose';

export interface IReview {
  _id: string;
  restaurantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  rating: number;
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;
  comment?: string;
  images: string[];
  response?: {
    text: string;
    respondedAt: Date;
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewDocument extends Omit<IReview, '_id'>, Document {}

const reviewSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    foodRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    ambianceRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
    images: [{ type: String }],
    response: {
      text: { type: String, maxlength: 1000 },
      respondedAt: { type: Date },
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ restaurantId: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ restaurantId: 1, customerId: 1 }, { unique: true });

// After save, recalculate restaurant rating
reviewSchema.post('save', async function () {
  const result = await mongoose.model('Review').aggregate([
    { $match: { restaurantId: this.restaurantId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length) {
    await mongoose.model('Restaurant').findByIdAndUpdate(this.restaurantId, {
      rating: Math.round(result[0].avg * 10) / 10,
      totalReviews: result[0].count,
    });
  }
});

export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);
