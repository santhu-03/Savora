import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Star, MapPin, Clock, Phone, Globe, ChevronRight,
  ShoppingBag, Minus, Plus, ChevronDown,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { MenuItemCard } from '@/components/restaurant/MenuItemCard';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { pageVariants } from '@/lib/motion';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/utils';
import type { Restaurant, Menu, Review } from '@/types';

type Tab = 'menu' | 'info' | 'reviews';

// ─── Cart Sidebar ─────────────────────────────────────────────
function CartSidebar({ restaurantId }: { restaurantId: string }) {
  const items = useCart(state => state.items);
  const updateQuantity = useCart(state => state.updateQuantity);
  const clearCart = useCart(state => state.clearCart);
  const totalPrice = useCart(state => state.totalPrice);

  if (items.length === 0) {
    return (
      <div className="border border-gold/12 rounded-2xl p-6 text-center bg-white">
        <ShoppingBag size={28} className="text-gold/30 mx-auto mb-3" />
        <p className="font-body text-sm text-charcoal/40">Your cart is empty</p>
        <p className="font-body text-xs text-charcoal/30 mt-1">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="border border-gold/15 rounded-2xl bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3.5 border-b border-gold/10 flex items-center justify-between">
        <h3 className="font-body font-semibold text-primary text-sm">Your cart</h3>
        <button onClick={clearCart} className="font-body text-xs text-copper hover:text-copper-dark transition-colors">Clear</button>
      </div>
      <div className="px-4 py-3 max-h-64 overflow-y-auto divide-y divide-gold/8">
        {items.map(item => (
          <div key={item.menuItemId} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-primary truncate">{item.name}</p>
              <p className="font-body text-xs text-gold">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors">
                <Minus size={10} />
              </button>
              <span className="font-body text-xs font-bold text-primary w-3 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-cream hover:bg-primary-light transition-colors">
                <Plus size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-gold/10 space-y-3">
        <div className="flex justify-between font-body text-sm">
          <span className="text-charcoal/60">Subtotal</span>
          <span className="font-semibold text-primary">{formatCurrency(totalPrice())}</span>
        </div>
        <Link
          to={`/cart?restaurantId=${restaurantId}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-cream text-sm font-body font-medium rounded-xl hover:bg-primary-light transition-colors"
        >
          Proceed to checkout <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─── Menu Tab ─────────────────────────────────────────────────
function MenuTab({ menu, restaurantId }: { menu: Menu; restaurantId: string }) {
  const [activeCategory, setActiveCategory] = useState(menu.categories[0]?._id ?? '');
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const itemsByCategory: Record<string, typeof menu.items> = {};
  menu.items.forEach(item => {
    if (!itemsByCategory[item.categoryId]) itemsByCategory[item.categoryId] = [];
    itemsByCategory[item.categoryId].push(item);
  });

  return (
    <div className="flex gap-6">
      {/* Category sidebar (desktop) */}
      <aside className="hidden md:block w-44 shrink-0">
        <div className="sticky top-24 space-y-1">
          {menu.categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => scrollToCategory(cat._id)}
              className={`w-full text-left px-3 py-2 text-sm font-body rounded-lg transition-colors ${
                activeCategory === cat._id
                  ? 'bg-primary text-cream font-medium'
                  : 'text-charcoal/60 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              {cat.name}
              <span className="ml-1 text-xs opacity-60">({(itemsByCategory[cat._id] ?? []).length})</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile category pills */}
      <div className="md:hidden -mx-4 px-4 mb-6 sticky top-16 z-10 bg-cream pb-3 pt-3 border-b border-gold/10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {menu.categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => scrollToCategory(cat._id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-body font-medium border transition-colors ${
                activeCategory === cat._id
                  ? 'bg-primary border-primary text-cream'
                  : 'border-gold/20 text-charcoal/60 hover:border-gold/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-10">
        {menu.categories.map(cat => {
          const catItems = itemsByCategory[cat._id] ?? [];
          if (catItems.length === 0) return null;
          return (
            <div key={cat._id} ref={el => { categoryRefs.current[cat._id] = el; }}>
              <h3 className="font-heading text-2xl text-primary mb-1">{cat.name}</h3>
              {cat.description && <p className="font-body text-xs text-charcoal/40 mb-4">{cat.description}</p>}
              <div className="grid sm:grid-cols-2 gap-4">
                {catItems.map(item => (
                  <MenuItemCard key={item._id} item={item} restaurantId={restaurantId} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────
function InfoTab({ restaurant }: { restaurant: Restaurant }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-heading text-xl text-primary mb-4">Operating Hours</h3>
        <div className="space-y-2">
          {days.map(day => {
            const hours = restaurant.operatingHours.find(h => h.day.toLowerCase() === day.toLowerCase());
            const isToday = new Date().toLocaleDateString('en', { weekday: 'long' }) === day;
            return (
              <div key={day} className={`flex justify-between py-2 text-sm font-body border-b border-gold/8 last:border-0 ${isToday ? 'font-semibold text-primary' : 'text-charcoal/60'}`}>
                <span>{day}</span>
                <span>{hours?.isClosed ? 'Closed' : `${hours?.open ?? '—'} – ${hours?.close ?? '—'}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-heading text-xl text-primary mb-3">Contact & Location</h3>
          <div className="space-y-2.5 text-sm font-body text-charcoal/60">
            <div className="flex items-center gap-2.5"><MapPin size={15} className="text-gold shrink-0" />{restaurant.address.street}, {restaurant.address.city} {restaurant.address.pincode}</div>
            <div className="flex items-center gap-2.5"><Phone size={15} className="text-gold shrink-0" />{restaurant.contact.phone}</div>
            {restaurant.contact.website && (
              <div className="flex items-center gap-2.5"><Globe size={15} className="text-gold shrink-0" /><a href={restaurant.contact.website} className="text-gold hover:underline">{restaurant.contact.website}</a></div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-xl text-primary mb-3">About</h3>
          <p className="font-body text-sm text-charcoal/60 leading-relaxed">{restaurant.description ?? 'No description available.'}</p>
        </div>

        {restaurant.images.length > 0 && (
          <div>
            <h3 className="font-heading text-xl text-primary mb-3">Gallery</h3>
            <div className="grid grid-cols-3 gap-2">
              {restaurant.images.slice(0, 6).map((img, i) => (
                <img key={i} src={img} alt="" className="aspect-square rounded-xl object-cover" loading="lazy" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────
function ReviewsTab({ restaurantId }: { restaurantId: string }) {
  const { isAuthenticated } = useAuth();
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: () => api.get<{ data: Review[] }>(`/restaurants/${restaurantId}/reviews`).then(r => r.data.data),
    staleTime: 3 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/restaurants/${restaurantId}/reviews`, { overallRating: newRating, comment }),
    onSuccess: () => { setNewRating(0); setComment(''); },
  });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const avgRating = reviews?.length
    ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex items-center gap-6 p-5 bg-white border border-gold/12 rounded-2xl">
        <div className="text-center">
          <div className="font-heading text-5xl text-primary">{avgRating.toFixed(1)}</div>
          <Rating value={avgRating} size="sm" />
          <p className="font-body text-xs text-charcoal/40 mt-1">{reviews?.length ?? 0} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map(n => {
            const count = reviews?.filter(r => Math.floor(r.overallRating) === n).length ?? 0;
            const pct = reviews?.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2">
                <span className="font-body text-xs text-charcoal/40 w-3">{n}</span>
                <div className="flex-1 h-1.5 bg-charcoal/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-body text-xs text-charcoal/40 w-5">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review form */}
      {isAuthenticated && (
        <div className="p-5 bg-white border border-gold/12 rounded-2xl">
          <h3 className="font-heading text-lg text-primary mb-4">Leave a review</h3>
          <Rating value={newRating} onChange={setNewRating} size="lg" className="mb-4" />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your dining experience…"
            rows={3}
            className="w-full px-4 py-3 border border-gold/15 rounded-xl text-sm font-body text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-gold/40 resize-none bg-cream/50"
          />
          <Button
            onClick={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={newRating === 0 || submitMutation.isPending}
            className="mt-3"
            size="sm"
          >
            Submit review
          </Button>
        </div>
      )}

      {/* Review list */}
      <div className="space-y-4">
        {reviews?.map(review => (
          <div key={review._id} className="p-5 bg-white border border-gold/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={review.customer.name} src={review.customer.avatar} size="sm" />
              <div>
                <p className="font-body font-semibold text-sm text-primary">{review.customer.name}</p>
                <p className="font-body text-xs text-charcoal/40">{formatRelative(review.createdAt)}</p>
              </div>
              <div className="ml-auto">
                <Rating value={review.overallRating} size="sm" />
              </div>
            </div>
            {review.comment && <p className="font-body text-sm text-charcoal/70 leading-relaxed">{review.comment}</p>}
            {review.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {review.tags.map(t => <Badge key={t} variant="neutral" size="sm">{t}</Badge>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showAllCuisine, setShowAllCuisine] = useState(false);
  const cartItems = useCart(state => state.items);
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = useCart(state => state.totalPrice);

  const { data: restaurant, isLoading: rLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => api.get<{ data: Restaurant }>(`/restaurants/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: menu, isLoading: mLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => api.get<{ data: Menu }>(`/restaurants/${id}/menu/active`).then(r => r.data.data),
    enabled: !!id && activeTab === 'menu',
  });

  if (rLoading) return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <Skeleton className="h-60 rounded-2xl" />
        <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /></div>
      </div>
    </PageLayout>
  );

  if (!restaurant) return (
    <PageLayout><div className="text-center py-20"><p className="font-body text-charcoal/40">Restaurant not found.</p></div></PageLayout>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'menu', label: 'Menu' },
    { key: 'info', label: 'Info & Hours' },
    { key: 'reviews', label: `Reviews (${restaurant.totalReviews})` },
  ];

  return (
    <motion.div {...pageVariants}>
      <PageLayout>
        {/* Hero */}
        <div className="relative">
          <div className="h-56 md:h-72 overflow-hidden">
            {restaurant.coverImage ? (
              <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary via-[#1a0710] to-primary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* Info card overlay */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
            <div className="bg-cream rounded-2xl shadow-lg border border-gold/12 p-5 md:p-6">
              <div className="flex items-start gap-4">
                {/* Logo */}
                {restaurant.logo && (
                  <img src={restaurant.logo} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-gold/20 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h1 className="font-heading text-3xl md:text-4xl text-primary">{restaurant.name}</h1>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Star size={16} className="fill-gold text-gold" />
                      <span className="font-body font-bold text-primary">{restaurant.averageRating.toFixed(1)}</span>
                      <span className="font-body text-xs text-charcoal/40">({restaurant.totalReviews})</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {restaurant.cuisine.slice(0, showAllCuisine ? undefined : 3).map(c => (
                      <Badge key={c} variant="neutral" size="sm">{c}</Badge>
                    ))}
                    {!showAllCuisine && restaurant.cuisine.length > 3 && (
                      <button onClick={() => setShowAllCuisine(true)} className="text-xs font-body text-gold flex items-center gap-0.5">
                        +{restaurant.cuisine.length - 3} more <ChevronDown size={11} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-body text-charcoal/50">
                    <span className="flex items-center gap-1"><MapPin size={11} />{restaurant.address.city}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />20–35 min</span>
                    {restaurant.settings.allowDelivery && (
                      <span>{restaurant.settings.deliveryFee === 0 ? '🟢 Free delivery' : `₹${restaurant.settings.deliveryFee} delivery`}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Tabs */}
          <div className="flex border-b border-gold/12 mb-6 gap-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative px-4 py-2.5 font-body text-sm font-medium transition-colors ${
                  activeTab === key ? 'text-primary' : 'text-charcoal/50 hover:text-primary'
                }`}
              >
                {label}
                {activeTab === key && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content + cart */}
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTab === 'menu' && (
                    mLoading ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                      </div>
                    ) : menu ? (
                      <MenuTab menu={menu} restaurantId={id!} />
                    ) : (
                      <div className="text-center py-12">
                        <Spinner />
                        <p className="font-body text-sm text-charcoal/40 mt-2">Loading menu…</p>
                      </div>
                    )
                  )}
                  {activeTab === 'info' && <InfoTab restaurant={restaurant} />}
                  {activeTab === 'reviews' && <ReviewsTab restaurantId={id!} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop cart sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20">
                <CartSidebar restaurantId={id!} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile floating cart */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="lg:hidden fixed bottom-6 left-4 right-4 z-40"
            >
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-primary rounded-2xl shadow-xl shadow-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
                    <ShoppingBag size={14} className="text-primary" />
                  </div>
                  <span className="font-body font-semibold text-cream text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                </div>
                <span className="font-body font-bold text-gold text-sm">{formatCurrency(totalPrice())} →</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile cart drawer */}
        <Drawer
          open={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          title="Your cart"
          footer={
            <Link
              to={`/cart?restaurantId=${id}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-cream text-sm font-body font-medium rounded-xl hover:bg-primary-light transition-colors"
              onClick={() => setCartDrawerOpen(false)}
            >
              Checkout · {formatCurrency(totalPrice())}
            </Link>
          }
        >
          <CartSidebar restaurantId={id!} />
        </Drawer>
      </PageLayout>
    </motion.div>
  );
}
