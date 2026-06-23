import { Request, Response } from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  const result = await PaymentService.createPaymentIntent(orderId, req.user?.userId);
  ApiResponse.success(res, result);
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const result = await PaymentService.handleWebhook(req.body as Buffer, signature);
  res.json(result);
});

export const refund = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, amount } = z.object({ orderId: z.string(), amount: z.number().optional() }).parse(req.body);
  const refund = await PaymentService.refund(orderId, amount);
  ApiResponse.success(res, { refundId: refund.id, amount: refund.amount / 100 });
});
