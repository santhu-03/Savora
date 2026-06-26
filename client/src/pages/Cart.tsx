import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  ShoppingBag, Minus, Plus, X, Tag, ChevronRight, Home,
  Package, Bike, Gift, AlertCircle,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getStripe } from '@/lib/stripe';
import { formatCurrency } from '@/lib/utils';
import type { Restaurant } from '@/types';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';

const ORDER_TYPES: { type: OrderType; icon: typeof Home; label: string; desc: string }[] = [
  { type: 'dine_in', icon: Home, label: 'Dine-in', desc: 'Eat at the restaurant' },
  { type: 'takeaway', icon: Package, label: 'Takeaway', desc: 'Pick up yourself' },
  { type: 'delivery', icon: Bike, label: 'Delivery', desc: 'Delivered to you' },
];

// ─── Payment Form ─────────────────────────────────────────────
function PaymentForm({ amount, onSuccess }: { amount: number; onSuccess: (orderId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Payment failed');
      setProcessing(false);
      return;
    }

    try {
      const { data } = await api.post<{ data: { orderId: string; clientSecret: string } }>('/orders/checkout', { amount });
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.data.clientSecret,
        confirmParams: { return_url: `${window.location.origin}/orders/${data.data.orderId}` },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message ?? 'Payment failed');
      } else {
        onSuccess(data.data.orderId);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'accordion' }} />
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-body">
          <AlertCircle size={15} />
          {error}
        </div>
      )}
      <Button type="submit" fullWidth loading={processing || !stripe} size="lg">
        Pay {formatCurrency(amount)}
      </Button>
    </form>
  );
}

// ─── Cart Page ────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId') ?? '';
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<'cart' | 'payment'>('cart');
  const [deliveryAddress, setDeliveryAddress] = useState({ street: '', city: '', pincode: '' });

  const { isAuthenticated } = useAuth();
  const items = useCart(state => state.items);
  const updateQuantity = useCart(state => state.updateQuantity);
  const clearCart = useCart(state => state.clearCart);
  const totalPrice = useCart(state => state.totalPrice);

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.get<{ data: Restaurant }>(`/restaurants/${restaurantId}`).then(r => r.data.data),
    enabled: !!restaurantId,
  });

  const subtotal = totalPrice();
  const taxRate = restaurant?.taxRate ?? 0.05;
  const tax = Math.round(subtotal * taxRate);
  const deliveryFee = orderType === 'delivery' ? (restaurant?.settings.deliveryFee ?? 40) : 0;
  const promoDiscount = promoApplied?.discount ?? 0;
  const loyaltyDiscount = useLoyalty ? 50 : 0;
  const total = subtotal + tax + deliveryFee - promoDiscount - loyaltyDiscount;

  const promoMutation = useMutation({
    mutationFn: () => api.post<{ data: { discount: number } }>('/promo/validate', { code: promoCode, restaurantId }),
    onSuccess: ({ data }) => setPromoApplied({ code: promoCode, discount: data.data.discount }),
  });

  const createIntentMutation = useMutation({
    mutationFn: () =>
      api.post<{ data: { clientSecret: string } }>('/payments/create-intent', {
        amount: total,
        restaurantId,
        orderType,
        promoCode: promoApplied?.code,
        useLoyalty,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      }).then(r => r.data),
    onSuccess: ({ data }) => {
      setClientSecret(data.clientSecret);
      setStep('payment');
    },
  });

  useEffect(() => {
    if (items.length === 0 && step === 'cart') {
      // Don't auto-redirect — let user see empty cart
    }
  }, [items, step]);

  if (items.length === 0) {
    return (
      <motion.div {...pageVariants}>
        <PageLayout>
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <ShoppingBag size={48} className="text-primary/20 mx-auto mb-4" />
            <h2 className="font-heading text-3xl text-primary mb-2">Your cart is empty</h2>
            <p className="font-body text-sm text-charcoal/50 mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/restaurants">
              <Button size="lg">Browse Restaurants</Button>
            </Link>
          </div>
        </PageLayout>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageVariants}>
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <motion.div initial="hidden" animate="show" variants={stagger} className="mb-8">
            <motion.h1 variants={fadeUp} className="font-heading text-4xl text-primary mb-1">
              {step === 'cart' ? 'Your Cart' : 'Payment'}
            </motion.h1>
            {restaurant && (
              <motion.p variants={fadeUp} className="font-body text-sm text-charcoal/50">
                from <span className="text-primary font-medium">{restaurant.name}</span>
              </motion.p>
            )}
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === 'cart' ? (
                  <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                    {/* Items */}
                    <div className="bg-white border border-gold/12 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
                        <h2 className="font-body font-semibold text-primary">Items ({items.length})</h2>
                        <button onClick={clearCart} className="font-body text-xs text-copper hover:text-copper-dark transition-colors">Clear all</button>
                      </div>
                      <div className="divide-y divide-gold/8">
                        {items.map(item => (
                          <div key={item.menuItemId} className="px-5 py-4 flex items-center gap-4">
                            {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-body font-medium text-sm text-primary truncate">{item.name}</p>
                              <p className="font-body text-sm text-gold font-semibold">{formatCurrency(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors">
                                {item.quantity === 1 ? <X size={13} /> : <Minus size={13} />}
                              </button>
                              <span className="font-body font-bold text-primary w-4 text-center text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-cream hover:bg-primary-light transition-colors">
                                <Plus size={13} />
                              </button>
                            </div>
                            <p className="font-body font-semibold text-sm text-primary w-16 text-right shrink-0">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order type */}
                    <div className="bg-white border border-gold/12 rounded-2xl p-5">
                      <h2 className="font-body font-semibold text-primary mb-4">Order type</h2>
                      <div className="grid grid-cols-3 gap-3">
                        {ORDER_TYPES.map(({ type, icon: Icon, label, desc }) => {
                          const unavailable = type === 'delivery' && !restaurant?.settings.allowDelivery;
                          return (
                            <button
                              key={type}
                              onClick={() => !unavailable && setOrderType(type)}
                              disabled={unavailable}
                              className={`p-3 rounded-xl border text-center transition-colors ${
                                orderType === type
                                  ? 'border-primary bg-primary/5'
                                  : unavailable
                                  ? 'border-charcoal/10 opacity-40 cursor-not-allowed'
                                  : 'border-gold/15 hover:border-gold/30'
                              }`}
                            >
                              <Icon size={18} className={orderType === type ? 'text-primary mx-auto mb-1.5' : 'text-charcoal/40 mx-auto mb-1.5'} />
                              <p className={`font-body text-xs font-medium ${orderType === type ? 'text-primary' : 'text-charcoal/60'}`}>{label}</p>
                              <p className="font-body text-[10px] text-charcoal/35">{desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery address */}
                    <AnimatePresence>
                      {orderType === 'delivery' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white border border-gold/12 rounded-2xl p-5 space-y-3">
                            <h2 className="font-body font-semibold text-primary">Delivery address</h2>
                            <Input
                              label="Street address"
                              value={deliveryAddress.street}
                              onChange={e => setDeliveryAddress(a => ({ ...a, street: e.target.value }))}
                              placeholder="123 Main Street, Apt 4"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="City"
                                value={deliveryAddress.city}
                                onChange={e => setDeliveryAddress(a => ({ ...a, city: e.target.value }))}
                                placeholder="Bengaluru"
                              />
                              <Input
                                label="Pincode"
                                value={deliveryAddress.pincode}
                                onChange={e => setDeliveryAddress(a => ({ ...a, pincode: e.target.value }))}
                                placeholder="560001"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Promo code */}
                    <div className="bg-white border border-gold/12 rounded-2xl p-5">
                      <h2 className="font-body font-semibold text-primary mb-3">Promo code</h2>
                      {promoApplied ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <Tag size={15} className="text-green-600 shrink-0" />
                          <div className="flex-1">
                            <p className="font-body text-sm font-medium text-green-700">{promoApplied.code}</p>
                            <p className="font-body text-xs text-green-600">− {formatCurrency(promoApplied.discount)} saved</p>
                          </div>
                          <button onClick={() => setPromoApplied(null)} className="text-green-500 hover:text-green-700">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="SAVE20"
                            className="flex-1 px-4 py-2.5 border border-gold/15 rounded-xl text-sm font-body text-charcoal focus:outline-none focus:border-gold/40"
                          />
                          <Button
                            variant="outline"
                            onClick={() => promoMutation.mutate()}
                            loading={promoMutation.isPending}
                            disabled={!promoCode}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Loyalty */}
                    {isAuthenticated && (
                      <div className="bg-white border border-gold/12 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Gift size={18} className="text-gold" />
                            <div>
                              <p className="font-body text-sm font-medium text-primary">Use loyalty points</p>
                              <p className="font-body text-xs text-charcoal/40">250 pts available · Save ₹50</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setUseLoyalty(o => !o)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${useLoyalty ? 'bg-gold' : 'bg-charcoal/15'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all ${useLoyalty ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="bg-white border border-gold/12 rounded-2xl p-5">
                      <h2 className="font-body font-semibold text-primary mb-5">Payment details</h2>
                      {clientSecret && (
                        <Elements
                          stripe={getStripe()}
                          options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#260B10', fontFamily: 'Inter, system-ui' } } }}
                        >
                          <PaymentForm
                            amount={total}
                            onSuccess={orderId => {
                              clearCart();
                              navigate(`/orders/${orderId}`);
                            }}
                          />
                        </Elements>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order summary (right) */}
            <div className="lg:w-80 shrink-0">
              <div className="bg-white border border-gold/12 rounded-2xl overflow-hidden sticky top-20">
                <div className="px-5 py-4 border-b border-gold/10">
                  <h2 className="font-body font-semibold text-primary">Order summary</h2>
                </div>
                <div className="px-5 py-4 space-y-3 font-body text-sm">
                  <div className="flex justify-between text-charcoal/60">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-charcoal/60">
                    <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <div className="flex justify-between text-charcoal/60">
                      <span>Delivery</span>
                      <span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1"><Tag size={12} />{promoApplied.code}</span>
                      <span>− {formatCurrency(promoApplied.discount)}</span>
                    </div>
                  )}
                  {useLoyalty && (
                    <div className="flex justify-between text-gold">
                      <span className="flex items-center gap-1"><Gift size={12} />Loyalty</span>
                      <span>− {formatCurrency(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gold/10 pt-3 flex justify-between font-semibold text-base text-primary">
                    <span>Total</span>
                    <span>{formatCurrency(Math.max(0, total))}</span>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  {step === 'cart' ? (
                    <Button
                      fullWidth
                      size="lg"
                      onClick={() => createIntentMutation.mutate()}
                      loading={createIntentMutation.isPending}
                      disabled={orderType === 'delivery' && !deliveryAddress.street}
                    >
                      Continue to payment <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <button
                      onClick={() => setStep('cart')}
                      className="w-full font-body text-sm text-charcoal/50 hover:text-primary transition-colors text-center py-2"
                    >
                      ← Back to cart
                    </button>
                  )}
                </div>
                <div className="px-5 pb-4 flex items-center justify-center gap-2">
                  <Badge variant="green" size="sm">Secure checkout</Badge>
                  <span className="font-body text-xs text-charcoal/30">Powered by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </motion.div>
  );
}
