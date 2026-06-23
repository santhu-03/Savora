import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { env } from './env';

let stripeClient: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
    logger.info('Stripe SDK initialized');
  }
  return stripeClient;
};

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => getStripe()[prop as keyof Stripe],
});
