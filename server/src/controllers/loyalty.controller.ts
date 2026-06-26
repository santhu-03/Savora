import { Request, Response } from 'express';
import { z } from 'zod';
import { LoyaltyPoints } from '../models/LoyaltyPoints.model';
import { Order } from '../models/Order.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';

const POINTS_PER_UNIT = 0.1;   // 1 point per ₹10 spent
const REDEMPTION_RATE = 0.10;  // 1 point = ₹0.10 (100 pts = ₹10)

async function getOrCreateLoyalty(customerId: string, restaurantId: string) {
  let record = await LoyaltyPoints.findOne({ customer: customerId, restaurant: restaurantId });
  if (!record) {
    record = await LoyaltyPoints.create({ customer: customerId, restaurant: restaurantId });
  }
  return record;
}

// GET /api/v1/loyalty/my-points
export const getMyPoints = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const filter: Record<string, unknown> = { customer: userId };
  if (req.query.restaurantId) filter.restaurant = req.query.restaurantId;

  const records = await LoyaltyPoints.find(filter).populate('restaurant', 'name logo');
  return ApiResponse.success(res, records);
});

// POST /api/v1/loyalty/earn  (internal — called after payment)
export const earnPoints = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, restaurantId, customerId, amount } = z
    .object({
      orderId: z.string().min(1),
      restaurantId: z.string().min(1),
      customerId: z.string().min(1),
      amount: z.coerce.number().min(0),
    })
    .parse(req.body);

  const pointsEarned = Math.floor(amount * POINTS_PER_UNIT);
  if (pointsEarned === 0) return ApiResponse.success(res, null, 'No points earned');

  const loyalty = await getOrCreateLoyalty(customerId, restaurantId);

  loyalty.currentPoints += pointsEarned;
  loyalty.lifetimePoints += pointsEarned;
  (loyalty as any).recalculateTier();
  loyalty.transactions.push({
    type: 'earn',
    points: pointsEarned,
    orderId,
    description: `Earned ${pointsEarned} pts on order`,
    createdAt: new Date(),
  } as any);

  await loyalty.save();
  await Order.findByIdAndUpdate(orderId, { loyaltyPointsEarned: pointsEarned });

  return ApiResponse.success(res, loyalty, `Earned ${pointsEarned} points`);
});

// POST /api/v1/loyalty/redeem
export const redeemPoints = asyncHandler(async (req: Request, res: Response) => {
  const { points, restaurantId, orderId } = z
    .object({
      points: z.coerce.number().int().min(100),
      restaurantId: z.string().min(1),
      orderId: z.string().optional(),
    })
    .parse(req.body);

  const loyalty = await LoyaltyPoints.findOne({
    customer: req.user!.userId,
    restaurant: restaurantId,
  });
  if (!loyalty) throw new AppError('No loyalty account found for this restaurant', 404);
  if (loyalty.currentPoints < points) throw new AppError('Insufficient points', 400, 'INSUFFICIENT_POINTS');

  const discountAmount = +(points * REDEMPTION_RATE).toFixed(2);

  loyalty.currentPoints -= points;
  loyalty.redeemedPoints += points;
  (loyalty as any).recalculateTier();
  loyalty.transactions.push({
    type: 'redeem',
    points: -points,
    orderId,
    description: `Redeemed ${points} pts for ₹${discountAmount} discount`,
    createdAt: new Date(),
  } as any);

  await loyalty.save();
  if (orderId) {
    await Order.findByIdAndUpdate(orderId, { loyaltyPointsRedeemed: points });
  }

  return ApiResponse.success(
    res,
    { discountAmount, remainingPoints: loyalty.currentPoints, tier: loyalty.tier },
    `Redeemed ${points} points`
  );
});

// GET /api/v1/loyalty/restaurant/:restaurantId/leaderboard
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const topN = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const leaders = await LoyaltyPoints.find({ restaurant: req.params.restaurantId })
    .sort({ lifetimePoints: -1 })
    .limit(topN)
    .populate('customer', 'name avatar loyaltyTier');

  return ApiResponse.success(res, leaders);
});
