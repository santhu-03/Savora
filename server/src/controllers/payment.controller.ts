import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  refund,
  getPaymentByOrder,
} from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';

// ─── POST /payments/create-intent ────────────────────────────
export const createIntent = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = z.object({ orderId: z.string().min(1) }).parse(req.body);
  const result = await createPaymentIntent(orderId, req.user?.userId);
  return ApiResponse.success(res, result);
});

// ─── POST /payments/confirm ───────────────────────────────────
export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const { paymentIntentId } = z
    .object({ paymentIntentId: z.string().min(1) })
    .parse(req.body);
  const result = await confirmPayment(paymentIntentId);
  return ApiResponse.success(res, result, 'Payment confirmed');
});

// ─── POST /payments/webhook ───────────────────────────────────
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
  }
  // req.body is a Buffer when the raw body parser is used (mounted in src/index.ts)
  const result = await handleWebhook(req.body as Buffer, signature);
  return res.json(result);
});

// ─── POST /payments/refund ────────────────────────────────────
export const processRefund = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, amount, reason } = z
    .object({
      orderId: z.string().min(1),
      amount: z.number().positive().optional(),
      reason: z.string().optional(),
    })
    .parse(req.body);

  const stripeRefund = await refund(orderId, amount, reason);
  return ApiResponse.success(res, {
    refundId: stripeRefund.id,
    amount: stripeRefund.amount / 100,
    status: stripeRefund.status,
  }, 'Refund initiated');
});

// ─── GET /payments/order/:orderId ─────────────────────────────
export const getByOrder = asyncHandler(async (req: Request, res: Response) => {
  const payment = await getPaymentByOrder(req.params.orderId);
  return ApiResponse.success(res, payment);
});

