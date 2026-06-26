import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag, X, ChevronRight, Leaf, Flame, Wheat, Minus, Plus,
  CheckCircle2, ChevronDown, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { pageVariants } from '@/lib/motion';
import { useCart } from '@/hooks/useCart';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────
interface QRMenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  dietary?: string[];
  allergens?: string[];
  prepTime?: number;
  isFeatured?: boolean;
}

interface QRMenuData {
  table:      { id: string; tableNumber: string; capacity: number; section?: string };
  restaurant: { _id: string; name: string; logo?: string; coverImage?: string; cuisine: string[]; rating?: number };
  menu:       Array<{ category: { _id: string; name: string }; items: QRMenuItem[] }>;
}

// ─── Dietary icon helpers ─────────────────────────────────────────
const DIETARY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  veg:         { icon: <Leaf  size={10} />, label: 'Veg',         color: 'text-green-600'  },
  vegan:       { icon: <Leaf  size={10} />, label: 'Vegan',       color: 'text-green-700'  },
  'non-veg':   { icon: <Flame size={10} />, label: 'Non-veg',     color: 'text-red-600'    },
  'gluten-free': { icon: <Wheat size={10} />, label: 'GF',        color: 'text-amber-600'  },
};

function DietaryPill({ type }: { type: string }) {
  const cfg = DIETARY_ICONS[type];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 font-body text-[10px] ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Item Card ────────────────────────────────────────────────────
function ItemCard({
  item,
  restaurantId,
  onTap,
}: {
  item: QRMenuItem;
  restaurantId: string;
  onTap: (item: QRMenuItem) => void;
}) {
  const addItem = useCart(s => s.addItem);
  const cartItems = useCart(s => s.items);
  const qty = cartItems.find(i => i.menuItemId === item._id)?.quantity ?? 0;
  const price = item.discountPrice ?? item.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-white border border-black/[0.06] shadow-sm active:scale-[0.97] transition-transform cursor-pointer"
      onClick={() => onTap(item)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-cream overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-gold/10 flex items-center justify-center">
            <span className="font-heading text-2xl text-primary/20">{item.name.charAt(0)}</span>
          </div>
        )}
        {item.isFeatured && (
          <span className="absolute top-2 left-2 font-body text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gold text-primary">
            Popular
          </span>
        )}
        {item.discountPrice && (
          <span className="absolute top-2 right-2 font-body text-[9px] font-bold px-2 py-0.5 rounded-full bg-copper text-white">
            OFFER
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-heading text-sm text-primary leading-snug line-clamp-2">{item.name}</p>
        {item.dietary && item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {item.dietary.map(d => <DietaryPill key={d} type={d} />)}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-body text-sm font-bold text-primary">{formatCurrency(price)}</span>
            {item.discountPrice && (
              <span className="font-body text-xs text-charcoal/35 line-through ml-1">
                {formatCurrency(item.price)}
              </span>
            )}
          </div>
          {qty > 0 ? (
            <div
              className="flex items-center gap-1.5 bg-primary rounded-full px-2 py-1"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="text-cream/70 hover:text-cream"
                onClick={() => useCart.getState().updateQuantity(item._id, qty - 1)}
              >
                <Minus size={10} />
              </button>
              <span className="font-body text-xs font-bold text-cream w-4 text-center">{qty}</span>
              <button
                className="text-cream/70 hover:text-cream"
                onClick={() => addItem(restaurantId, { menuItemId: item._id, name: item.name, price: item.discountPrice ?? item.price, quantity: 1, image: item.images?.[0] })}
              >
                <Plus size={10} />
              </button>
            </div>
          ) : (
            <button
              className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary-light transition-colors"
              onClick={e => { e.stopPropagation(); addItem(restaurantId, { menuItemId: item._id, name: item.name, price: item.discountPrice ?? item.price, quantity: 1, image: item.images?.[0] }); }}
            >
              <Plus size={13} className="text-gold" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Item Detail Modal ────────────────────────────────────────────
function ItemModal({
  item,
  restaurantId,
  onClose,
}: {
  item: QRMenuItem;
  restaurantId: string;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const addItem = useCart(s => s.addItem);
  const price = item.discountPrice ?? item.price;

  const handleAdd = () => {
    addItem(restaurantId, {
      menuItemId: item._id,
      name:       item.name,
      price:      price,
      quantity:   qty,
      image:      item.images?.[0],
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full bg-cream rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden flex-shrink-0">
          {item.images?.[0] ? (
            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-gold/20 flex items-center justify-center">
              <span className="font-heading text-5xl text-primary/20">{item.name.charAt(0)}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm text-white"
          >
            <X size={16} />
          </button>
          {item.isFeatured && (
            <span className="absolute top-4 left-4 font-body text-xs font-semibold px-3 py-1 rounded-full bg-gold text-primary">
              Popular
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2 no-scrollbar">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="font-heading text-2xl text-primary leading-tight flex-1">{item.name}</h2>
            <div className="text-right flex-shrink-0">
              <p className="font-body text-xl font-bold text-primary">{formatCurrency(price)}</p>
              {item.discountPrice && (
                <p className="font-body text-xs text-charcoal/35 line-through">{formatCurrency(item.price)}</p>
              )}
            </div>
          </div>

          {/* Dietary */}
          {item.dietary && item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {item.dietary.map(d => <DietaryPill key={d} type={d} />)}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="font-body text-sm text-charcoal/70 leading-relaxed mb-4">{item.description}</p>
          )}

          {/* Prep time */}
          {item.prepTime != null && (
            <div className="flex items-center gap-1.5 text-charcoal/40 mb-4">
              <Clock size={13} />
              <span className="font-body text-xs">{item.prepTime} min prep time</span>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <p className="font-body text-xs font-semibold text-amber-700 mb-1">Allergens</p>
              <p className="font-body text-xs text-amber-600">{item.allergens.join(' · ')}</p>
            </div>
          )}
        </div>

        {/* Footer: qty + add */}
        <div className="px-5 pt-3 pb-6 flex items-center gap-4 border-t border-black/[0.06] bg-cream">
          <div className="flex items-center gap-3 bg-primary/[0.06] rounded-full px-4 py-2">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="text-primary/60 hover:text-primary transition-colors"
            >
              <Minus size={15} />
            </button>
            <span className="font-body font-bold text-primary w-5 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="text-primary/60 hover:text-primary transition-colors"
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 bg-primary text-cream font-body font-semibold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <ShoppingBag size={15} />
            Add to cart · {formatCurrency(price * qty)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Order success tracker ────────────────────────────────────────
function OrderTracker({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const { status, getStatusMessage } = useOrderTracking(orderId);

  const steps = ['pending', 'confirmed', 'preparing', 'ready', 'served'] as const;
  const activeIdx = status ? steps.indexOf(status as any) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 bg-primary rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-body text-xs text-gold/70">Order placed</p>
          <p className="font-heading text-base text-cream">#{orderNumber}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-body text-xs text-cream/60">Live</span>
        </div>
      </div>

      {/* Status message */}
      <p className="font-body text-sm text-gold mb-3">
        {status ? getStatusMessage(status as any) : 'Sending order to kitchen…'}
      </p>

      {/* Mini stepper */}
      <div className="flex items-center gap-1">
        {steps.slice(0, 4).map((step, i) => (
          <div key={step} className="flex-1 flex items-center gap-1">
            <div
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                i <= activeIdx ? 'bg-gold' : 'bg-white/10'
              }`}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Cart Sheet ───────────────────────────────────────────────────
function CartSheet({
  tableId,
  restaurantId,
  restaurantName,
  tableNumber,
  onClose,
  onOrderPlaced,
}: {
  tableId:        string;
  restaurantId:   string;
  restaurantName: string;
  tableNumber:    string;
  onClose:        () => void;
  onOrderPlaced:  (order: { orderId: string; orderNumber: string }) => void;
}) {
  const cartItems   = useCart(s => s.items);
  const totalPrice  = useCart(s => s.totalPrice);
  const updateQty   = useCart(s => s.updateQuantity);
  const clearCart   = useCart(s => s.clearCart);

  const [step, setStep]         = useState<'cart' | 'confirm'>('cart');
  const [guestName, setGuestName] = useState('');
  const [placing, setPlacing]   = useState(false);
  const [error, setError]       = useState('');

  const placeOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const res = await api.post('/qr-menu/order', {
        tableId,
        restaurantId,
        guestName: guestName.trim() || undefined,
        items: cartItems.map(i => ({
          menuItemId:          i.menuItemId,
          quantity:            i.quantity,
          specialInstructions: i.notes,
        })),
      });
      clearCart();
      onOrderPlaced(res.data.data);
      onClose();
    } catch {
      setError('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative bg-cream rounded-t-3xl flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-charcoal/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] flex-shrink-0">
          <div>
            <h3 className="font-heading text-lg text-primary">
              {step === 'cart' ? 'Your Order' : 'Confirm Order'}
            </h3>
            <p className="font-body text-xs text-charcoal/40">
              {restaurantName} · Table {tableNumber}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center text-charcoal/50 hover:text-charcoal transition-colors">
            <X size={15} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'cart' ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex-1 overflow-y-auto no-scrollbar"
            >
              {/* Items */}
              <div className="px-5 py-4 space-y-3">
                {cartItems.map(item => (
                  <div key={item.menuItemId} className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-charcoal truncate">{item.name}</p>
                      <p className="font-body text-xs text-charcoal/50">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.menuItemId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-primary/[0.07] flex items-center justify-center text-primary/60 hover:bg-primary/15 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-body text-sm font-bold text-primary w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.menuItemId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-primary/[0.07] flex items-center justify-center text-primary/60 hover:bg-primary/15 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-body text-sm font-bold text-primary w-14 text-right flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex-1 overflow-y-auto no-scrollbar px-5 py-4"
            >
              <p className="font-body text-sm text-charcoal/60 mb-4">
                Your order will be sent directly to the kitchen. Enter your name so the team can call you when it's ready (optional).
              </p>
              <div>
                <label className="font-body text-xs text-charcoal/50 block mb-1.5">Your name (optional)</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="e.g. Arjun"
                  className="input w-full"
                  maxLength={50}
                />
              </div>
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  <AlertCircle size={14} />
                  <p className="font-body text-xs">{error}</p>
                </div>
              )}
              {/* Order summary */}
              <div className="mt-4 bg-primary/[0.04] rounded-2xl p-4 space-y-2">
                {cartItems.map(i => (
                  <div key={i.menuItemId} className="flex justify-between">
                    <span className="font-body text-sm text-charcoal/70">{i.quantity}× {i.name}</span>
                    <span className="font-body text-sm text-charcoal">{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-5 pt-3 pb-7 border-t border-black/[0.06] flex-shrink-0 bg-cream">
          <div className="flex items-center justify-between mb-4">
            <span className="font-body text-sm text-charcoal/60">Total</span>
            <span className="font-heading text-xl text-primary">{formatCurrency(totalPrice())}</span>
          </div>
          {step === 'cart' ? (
            <button
              onClick={() => setStep('confirm')}
              className="w-full bg-primary text-cream font-body font-semibold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep('cart')}
                className="px-4 py-4 rounded-2xl border border-primary/20 text-primary font-body text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="flex-1 bg-primary text-cream font-body font-semibold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-60"
              >
                {placing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {placing ? 'Placing order…' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main QRMenu page ─────────────────────────────────────────────
export default function QRMenu() {
  const { tableId } = useParams<{ tableId: string }>();
  const pillsRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<QRMenuData>({
    queryKey:  ['qr-menu', tableId],
    queryFn:   () => api.get(`/qr-menu/${tableId}`).then(r => r.data.data),
    enabled:   !!tableId,
    staleTime: 2 * 60 * 1000,
  });

  const categories = data?.menu.map(m => m.category) ?? [];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const selected   = activeCategory ?? categories[0]?._id ?? '';
  const visibleItems = data?.menu.find(m => m.category._id === selected)?.items ?? [];

  // Scroll active pill into view
  useEffect(() => {
    if (!selected || !pillsRef.current) return;
    const btn = pillsRef.current.querySelector(`[data-cat="${selected}"]`) as HTMLElement | null;
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selected]);

  const cartItems  = useCart(s => s.items);
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = useCart(s => s.totalPrice);
  const [selectedItem, setSelectedItem] = useState<QRMenuItem | null>(null);
  const [cartOpen, setCartOpen]         = useState(false);
  const [placedOrder, setPlacedOrder]   = useState<{ orderId: string; orderNumber: string } | null>(null);

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="h-28 bg-primary" />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-9 rounded-full w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/[0.06] flex items-center justify-center">
          <ShoppingBag size={32} className="text-primary/30" />
        </div>
        <h2 className="font-heading text-2xl text-primary">Invalid QR Code</h2>
        <p className="font-body text-sm text-charcoal/50 text-center max-w-xs">
          This QR code is not recognised. Please scan again or ask your server for help.
        </p>
        <a href="/" className="font-body text-sm text-gold hover:text-gold-dark transition-colors">
          ← Back to home
        </a>
      </div>
    );
  }

  const { table, restaurant } = data;

  return (
    <motion.div {...pageVariants} className="min-h-screen bg-cream">
      {/* ── Sticky header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-primary">
        <div className="px-4 h-14 flex items-center gap-3">
          {restaurant.logo ? (
            <img src={restaurant.logo} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="font-heading text-gold text-sm">{restaurant.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sm text-cream truncate leading-tight">{restaurant.name}</p>
            <p className="font-body text-xs text-gold/70">
              Table {table.tableNumber}{table.section ? ` · ${table.section}` : ''}
            </p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-cream/70 hover:text-cream transition-colors"
          >
            <ShoppingBag size={20} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold text-primary text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div
            ref={pillsRef}
            className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3 pt-0.5"
          >
            {categories.map(cat => (
              <button
                key={cat._id}
                data-cat={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`shrink-0 px-4 py-1.5 rounded-full font-body text-xs font-medium transition-colors duration-150 ${
                  selected === cat._id
                    ? 'bg-gold text-primary'
                    : 'bg-white/10 text-cream/60 hover:bg-white/20'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Order tracker (after placing) ───────────────────────── */}
      <AnimatePresence>
        {placedOrder && (
          <OrderTracker orderId={placedOrder.orderId} orderNumber={placedOrder.orderNumber} />
        )}
      </AnimatePresence>

      {/* ── Menu items ───────────────────────────────────────────── */}
      <div className="px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <h2 className="font-heading text-xl text-primary mb-4">
              {categories.find(c => c._id === selected)?.name}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {visibleItems.map(item => (
                <ItemCard
                  key={item._id}
                  item={item}
                  restaurantId={restaurant._id}
                  onTap={setSelectedItem}
                />
              ))}
            </div>
            {visibleItems.length === 0 && (
              <div className="text-center py-14">
                <p className="font-body text-sm text-charcoal/30">No items in this category</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dietary legend */}
      <div className="px-4 pb-2 flex gap-4 flex-wrap">
        {Object.entries(DIETARY_ICONS).map(([key, cfg]) => (
          <span key={key} className={`flex items-center gap-1 font-body text-xs ${cfg.color} opacity-50`}>
            {cfg.icon} {cfg.label}
          </span>
        ))}
      </div>

      {/* ── Cart FAB ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {totalItems > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-primary text-cream rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
                  <ShoppingBag size={14} className="text-primary" />
                </div>
                <span className="font-body font-semibold text-sm">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body font-bold text-gold text-sm">{formatCurrency(totalPrice())}</span>
                <ChevronDown size={16} className="text-cream/50 rotate-180" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom padding for FAB */}
      <div className="h-28" />

      {/* ── Item modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <ItemModal
            item={selectedItem}
            restaurantId={restaurant._id}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Cart sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <CartSheet
            tableId={tableId ?? ''}
            restaurantId={restaurant._id}
            restaurantName={restaurant.name}
            tableNumber={table.tableNumber}
            onClose={() => setCartOpen(false)}
            onOrderPlaced={order => { setPlacedOrder(order); setCartOpen(false); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
