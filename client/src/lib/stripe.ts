import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PK ?? '');
  }
  return stripePromise;
}
