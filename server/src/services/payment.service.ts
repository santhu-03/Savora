import Stripe from 'stripe';
import { getStripe } from '../config/stripe';
import { Order } from '../models/Order.model';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getIO } from '../config/socket';

export class PaymentService {
  // ─── Create payment intent ────────────────────────────────────
  static async createPaymentIntent(orderId: string, customerId?: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.paymentStatus === 'paid') throw new AppError('Order already paid', 400);

    const stripe = getStripe();
    const amountInPaise = Math.round(order.total * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        restaurantId: order.restaurant.toString(),
      },
      ...(customerId && { customer: customerId }),
    });

    order.stripePaymentIntentId = intent.id;
    await order.save();

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  // ─── Confirm payment (from webhook) ───────────────────────────
  static async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', { err });
      throw new AppError('Invalid webhook signature', 400);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata.orderId;
        if (!orderId) break;

        await Order.findByIdAndUpdate(orderId, {
          $set: {
            paymentStatus: 'paid',
            paymentMethod: intent.payment_method_types[0] ?? 'card',
            paidAt: new Date() as any,
          },
        });

        const order = await Order.findById(orderId).populate('restaurant');
        getIO()?.to(`restaurant:${intent.metadata.restaurantId}`).emit('paymentReceived', {
          orderId,
          amount: intent.amount / 100,
        });
        logger.info('Payment succeeded', { orderId, amount: intent.amount });
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata.orderId;
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
          logger.warn('Payment failed', { orderId });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await Order.findOneAndUpdate(
            { paymentIntentId: charge.payment_intent },
            { paymentStatus: 'refunded', refundedAt: new Date(), refundAmount: charge.amount_refunded / 100 }
          );
        }
        break;
      }

      default:
        logger.debug('Unhandled stripe event', { type: event.type });
    }

    return { received: true };
  }

  // ─── Refund ───────────────────────────────────────────────────
  static async refund(orderId: string, amount?: number) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.paymentStatus !== 'paid') throw new AppError('Order is not paid', 400);
    if (!order.stripePaymentIntentId) throw new AppError('No payment intent on order', 400);

    const stripe = getStripe();
    const params: Stripe.RefundCreateParams = { payment_intent: order.stripePaymentIntentId };
    if (amount) params.amount = Math.round(amount * 100);

    const refund = await stripe.refunds.create(params);

    order.paymentStatus = 'refunded';
    order.refundedAt = new Date();
    order.refundAmount = refund.amount / 100;
    await order.save();

    logger.info('Refund issued', { orderId, refundId: refund.id, amount: refund.amount / 100 });
    return refund;
  }
}
