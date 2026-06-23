import { Request, Response } from 'express';
import { z } from 'zod';
import { Review } from '../models/Review.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { parsePagination, buildMeta } from '../utils/pagination';

const reviewSchema = z.object({
  orderId: z.string(),
  overallRating: z.number().int().min(1).max(5),
  foodRating: z.number().int().min(1).max(5).optional(),
  serviceRating: z.number().int().min(1).max(5).optional(),
  ambienceRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional(),
  isAnonymous: z.boolean().optional(),
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = parsePagination(req.query as Record<string, string>);
  const filter: Record<string, unknown> = { restaurant: req.params.restaurantId, isPublished: true };
  if (req.query.rating) filter.overallRating = Number(req.query.rating);

  const [data, total] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limit).populate('customer', 'name avatar'),
    Review.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, data, buildMeta(total, page, limit));
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const data = reviewSchema.parse(req.body);
  const images = (req.files as Express.Multer.File[])?.map((f: any) => ({ url: f.path, publicId: f.filename })) ?? [];

  const exists = await Review.findOne({ customer: req.user!.userId, restaurant: req.params.restaurantId });
  if (exists) throw new AppError('You have already reviewed this restaurant', 409);

  const review = await Review.create({
    ...data,
    restaurant: req.params.restaurantId,
    customer: req.user!.userId,
    images,
  });
  ApiResponse.created(res, review);
});

export const respondToReview = asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(10) }).parse(req.body);
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, restaurant: req.params.restaurantId },
    { response: { text, respondedAt: new Date(), respondedBy: req.user!.userId } },
    { new: true }
  );
  if (!review) throw new AppError('Review not found', 404);
  ApiResponse.success(res, review);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, customer: req.user!.userId });
  if (!review) throw new AppError('Review not found', 404);
  ApiResponse.noContent(res);
});
