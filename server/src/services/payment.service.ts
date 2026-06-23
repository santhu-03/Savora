import Stripe from 'stripe';
import mongoose from 'mongoose';
import { Payment, IPaymentDocument } from '../models/Payment';
import { Order } from '../models/Order';
import { AppError } from '../middleware/errorHandler';
import { getStripe } from '../config/stripe';
import { getIO } from '../config/socket';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// ─── Create Stripe PaymentIntent ──────────────────────────────
export async function createPaymentIntent(
  orderId: string,
  customerId?: string
): Promise<{ clientSecret: string; paymentIntentId: string; amount: number }> {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (order.paymentStatus === 'paid') throw new AppError('Order already paid', 400);

  const amountInPaise = Math.round(order.total * 100);

  const intent = await getStripe().paymentIntents.create({
    amount: amountInPaise,
    currency: 'inr',
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId.toString(),
    },
  });

  await Payment.findOneAndUpdate(
    { orderId: order._id },
    {
      orderId: order._id,
      restaurantId: order.restaurantId,
      customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined,
      amount: order.total,
      currency: 'INR',
      method: 'card',
      stripePaymentIntentId: intent.id,
      status: 'processing',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Order.findByIdAndUpdate(orderId, { stripePaymentIntentId: intent.id });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
    amount: order.total,
  };
}

// ─── Confirm payment (client-side) ────────────────────────────
export async function confirmPayment(paymentIntentId: string) {
  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== 'succeeded') {
    throw new AppError(`Payment not yet succeeded (status: ${intent.status})`, 400);
  }

  const orderId = intent.metadata.orderId;
  const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : undefined;

  const [payment, order] = await Promise.all([
    Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: 'succeeded', ...(chargeId && { stripeChargeId: chargeId }) },
      { new: true }
    ),
    Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'confirmed' }, { new: true }),
  ]);

  if (!order) throw new AppError('Order not found', 404);

  const io = getIO();
  io?.to(`restaurant:${order.restaurantId}`).emit('payment_confirmed', {
    orderId,
    orderNumber: order.orderNumber,
    amount: order.total,
  });
  if (order.customerId) {
    io?.to(`user:${order.customerId}`).emit('payment_confirmed', {
      orderId,
      orderNumber: order.orderNumber,
    });
  }

  return { payment, order };
}

// ─── Stripe webhook ───────────────────────────────────────────
export async function handleWebhook(rawBody: Buffer, signature: string) {
  if (!env.stripeWebhookSecret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (err) {
    throw new AppError(`Webhook verification failed: ${(err as Error).message}`, 400);
  }

  logger.info('Stripe webhook received', { type: event.type });

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : undefined;

      if (orderId) {
        await Promise.all([
          Payment.findOneAndUpdate(
            { stripePaymentIntentId: intent.id },
            { status: 'succeeded', ...(chargeId && { stripeChargeId: chargeId }) }
          ),
          Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'confirmed' }),
        ]);

        const order = await Order.findById(orderId).select('restaurantId orderNumber customerId total');
        const io = getIO();
        if (order) {
          io?.to(`restaurant:${order.restaurantId}`).emit('payment_confirmed', {
            orderId,
            orderNumber: order.orderNumber,
            amount: order.total,
          });
          if (order.customerId) {
            io?.to(`user:${order.customerId}`).emit('payment_confirmed', { orderId, orderNumber: order.orderNumber });
          }
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: 'failed' }
      );
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
        const order = await Order.findById(orderId).select('customerId orderNumber');
        if (order?.customerId) {
          getIO()?.to(`user:${order.customerId}`).emit('payment_failed', {
            orderId,
            orderNumber: order.orderNumber,
          });
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

      if (intentId) {
        const payment = await Payment.findOneAndUpdate(
          { stripePaymentIntentId: intentId },
          { status: 'refunded', refundAmount: charge.amount_refunded / 100 },
          { new: true }
        );
        if (payment) {
          await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'refunded' });
        }
      }
      break;
    }

    default:
      logger.debug('Unhandled Stripe webhook event', { type: event.type });
  }

  return { received: true };
}

// ─── Refund ───────────────────────────────────────────────────
export async function refund(
  orderId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> {
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw new AppError('Payment record not found', 404);
  if (payment.status !== 'succeeded') throw new AppError('Only succeeded payments can be refunded', 400);
  if (!payment.stripePaymentIntentId) throw new AppError('No Stripe payment associated', 400);

  const params: Stripe.RefundCreateParams = {
    payment_intent: payment.stripePaymentIntentId,
  };
  if (amount) params.amount = Math.round(amount * 100);
  const VALID_REASONS = ['duplicate', 'fraudulent', 'requested_by_customer'] as const;
  type RefundReason = typeof VALID_REASONS[number];
  if (reason && VALID_REASONS.includes(reason as RefundReason)) {
    params.reason = reason as RefundReason;
  }

  const stripeRefund = await getStripe().refunds.create(params);

  const refundedAmount = stripeRefund.amount / 100;
  await Promise.all([
    Payment.findByIdAndUpdate(payment._id, {
      status: 'refunded',
      refundAmount: refundedAmount,
      refundReason: reason,
    }),
    Order.findByIdAndUpdate(orderId, { paymentStatus: 'refunded' }),
  ]);

  return stripeRefund;
}

// ─── Get payment by order ─────────────────────────────────────
export async function getPaymentByOrder(orderId: string): Promise<IPaymentDocument> {
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw new AppError('Payment not found for this order', 404);
  return payment;
}

// ─── Backward-compat class API ────────────────────────────────
export class PaymentService {
  static async createPaymentIntent(orderId: string, customerId?: string) {
    return createPaymentIntent(orderId, customerId);
  }
  static async handleWebhook(rawBody: Buffer, signature: string) {
    return handleWebhook(rawBody, signature);
  }
  static async refund(orderId: string, amount?: number) {
    return refund(orderId, amount);
  }
}
