import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, CalendarDays, Gift, MapPin, Settings,
  Star, Repeat, Trophy, Plus, Trash2,
  LogOut, Bell, Lock, User,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Reservation, LoyaltyRecord } from '@/types';

type ProfileTab = 'orders' | 'reservations' | 'loyalty' | 'addresses' | 'settings';

const TABS: { key: ProfileTab; icon: typeof ClipboardList; label: string }[] = [
  { key: 'orders', icon: ClipboardList, label: 'Orders' },
  { key: 'reservations', icon: CalendarDays, label: 'Reservations' },
  { key: 'loyalty', icon: Gift, label: 'Loyalty' },
  { key: 'addresses', icon: MapPin, label: 'Addresses' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-orange-300 to-amber-600',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-300 to-amber-500',
  platinum: 'from-slate-300 to-slate-600',
};

const TIER_NEXT: Record<string, number> = { bronze: 1000, silver: 5000, gold: 15000, platinum: Infinity };

// ─── Orders Tab ───────────────────────────────────────────────
function OrdersTab() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get<{ data: Order[] }>('/orders/my-orders').then(r => r.data.data),
  });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (!orders?.length) return (
    <div className="text-center py-16">
      <ClipboardList size={36} className="text-primary/20 mx-auto mb-3" />
      <p className="font-heading text-xl text-primary/40">No orders yet</p>
      <Link to="/restaurants" className="font-body text-sm text-gold mt-2 block">Start ordering →</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const restaurant = typeof order.restaurant !== 'string' ? order.restaurant : null;
        const isCompleted = ['completed', 'served'].includes(order.status);
        return (
          <div key={order._id} className="bg-white border border-gold/12 rounded-2xl overflow-hidden hover:border-gold/25 hover:shadow-sm transition-all">
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-body font-semibold text-sm text-primary">{restaurant?.name ?? 'Restaurant'}</p>
                  <p className="font-body text-xs text-charcoal/40 mt-0.5">{formatDate(order.placedAt)} · #{order.orderNumber}</p>
                  <p className="font-body text-xs text-charcoal/50 mt-1">
                    {order.items.slice(0, 2).map(i => i.name).join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body font-bold text-primary text-sm">{formatCurrency(order.total)}</p>
                  <Badge
                    className="mt-1"
                    variant={isCompleted ? 'green' : order.status === 'cancelled' ? 'red' : 'gold'}
                    size="sm"
                  >
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                {!isCompleted && (
                  <Link to={`/orders/${order._id}`}>
                    <Button size="sm" variant="outline">Track order</Button>
                  </Link>
                )}
                {isCompleted && (
                  <Button size="sm" variant="outline" icon={<Repeat size={13} />}>
                    Reorder
                  </Button>
                )}
                {order.loyaltyPointsEarned > 0 && (
                  <span className="flex items-center gap-1 text-xs font-body text-gold">
                    <Star size={11} className="fill-gold" />+{order.loyaltyPointsEarned} pts
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Reservations Tab ─────────────────────────────────────────
function ReservationsTab() {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => api.get<{ data: Reservation[] }>('/reservations/my-reservations').then(r => r.data.data),
  });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!reservations?.length) return (
    <div className="text-center py-16">
      <CalendarDays size={36} className="text-primary/20 mx-auto mb-3" />
      <p className="font-heading text-xl text-primary/40">No reservations</p>
      <Link to="/reservation" className="font-body text-sm text-gold mt-2 block">Book a table →</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {reservations.map(r => {
        const restaurant = typeof r.restaurant !== 'string' ? r.restaurant : null;
        const isPast = new Date(r.date) < new Date();
        return (
          <div key={r._id} className="bg-white border border-gold/12 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body font-semibold text-sm text-primary">{restaurant?.name ?? 'Restaurant'}</p>
                <p className="font-body text-xs text-charcoal/50 mt-0.5">
                  {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} · {r.time} · {r.partySize} guests
                </p>
                {r.table && <p className="font-body text-xs text-charcoal/40 mt-0.5">Table {r.table.number}</p>}
              </div>
              <Badge variant={r.status === 'confirmed' ? 'green' : r.status === 'cancelled' ? 'red' : 'neutral'} size="sm">
                {r.status}
              </Badge>
            </div>
            {!isPast && r.status === 'confirmed' && (
              <div className="mt-3 flex items-center gap-3">
                <span className="font-body text-xs text-charcoal/40 bg-charcoal/5 px-3 py-1 rounded-full">
                  Code: {r.confirmationCode}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Loyalty Tab ──────────────────────────────────────────────
function LoyaltyTab() {
  const { data: loyalty, isLoading } = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => api.get<{ data: LoyaltyRecord[] }>('/loyalty/my-points').then(r => r.data.data),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-32" /></div>;

  const totalPoints = loyalty?.reduce((s, l) => s + l.currentPoints, 0) ?? 0;
  const topTier = loyalty?.sort((a, b) => {
    const order = ['bronze', 'silver', 'gold', 'platinum'];
    return order.indexOf(b.tier) - order.indexOf(a.tier);
  })[0];
  const tier = topTier?.tier ?? 'bronze';
  const tierProgress = topTier?.tierProgress ?? 0;

  return (
    <div className="space-y-5">
      {/* Points card */}
      <div className={`rounded-2xl p-6 text-cream bg-gradient-to-br ${TIER_COLORS[tier]} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start justify-between relative">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-cream/70 mb-1">Total points</p>
            <p className="font-heading text-5xl text-cream">{totalPoints.toLocaleString()}</p>
            <p className="font-body text-sm text-cream/70 mt-1">≈ {formatCurrency(Math.floor(totalPoints / 10))} value</p>
          </div>
          <div className="text-right">
            <Trophy size={24} className="text-cream/80 mb-1 ml-auto" />
            <Badge variant="gold" className="font-semibold capitalize">{tier}</Badge>
          </div>
        </div>
        {topTier && TIER_NEXT[tier] !== Infinity && (
          <div className="mt-5 relative">
            <div className="flex justify-between text-xs text-cream/70 font-body mb-1.5">
              <span>{tier}</span>
              <span>Next: {topTier.nextTierPoints - topTier.currentPoints} pts to {Object.keys(TIER_NEXT)[Object.keys(TIER_NEXT).indexOf(tier) + 1]}</span>
            </div>
            <div className="h-1.5 bg-cream/20 rounded-full overflow-hidden">
              <div className="h-full bg-cream rounded-full transition-all" style={{ width: `${Math.min(100, tierProgress)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="bg-white border border-gold/12 rounded-2xl p-5">
        <h3 className="font-heading text-lg text-primary mb-4">Earn & redeem</h3>
        <div className="space-y-3 font-body text-sm">
          {[
            { label: 'Every ₹10 spent earns', value: '1 point' },
            { label: '100 points =', value: '₹10 discount' },
            { label: 'Birthday bonus', value: '2× points' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-gold/8 last:border-0">
              <span className="text-charcoal/60">{label}</span>
              <span className="font-semibold text-primary">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-restaurant breakdown */}
      {loyalty && loyalty.length > 0 && (
        <div className="bg-white border border-gold/12 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gold/10">
            <h3 className="font-body font-semibold text-primary">By restaurant</h3>
          </div>
          <div className="divide-y divide-gold/8">
            {loyalty.map(l => (
              <div key={l._id} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-primary">{l.restaurant.name}</p>
                  <p className="font-body text-xs text-charcoal/40">{l.lifetimePoints} lifetime pts</p>
                </div>
                <div className="text-right">
                  <p className="font-body font-bold text-primary text-sm">{l.currentPoints} pts</p>
                  <Badge variant="neutral" size="sm" className="capitalize">{l.tier}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Addresses Tab ────────────────────────────────────────────
interface SavedAddress {
  _id: string;
  label: string;
  street: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

function AddressesTab() {
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get<{ data: SavedAddress[] }>('/users/me/addresses').then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;

  return (
    <div className="space-y-4">
      {(!addresses || addresses.length === 0) ? (
        <div className="text-center py-12">
          <MapPin size={32} className="text-primary/20 mx-auto mb-3" />
          <p className="font-heading text-lg text-primary/40 mb-1">No saved addresses</p>
          <p className="font-body text-sm text-charcoal/40">Add addresses to speed up checkout</p>
        </div>
      ) : addresses.map(addr => (
        <div key={addr._id} className="bg-white border border-gold/12 rounded-2xl p-4 flex items-center gap-4">
          <MapPin size={18} className="text-gold shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-body font-semibold text-sm text-primary">{addr.label}</p>
              {addr.isDefault && <Badge variant="gold" size="sm">Default</Badge>}
            </div>
            <p className="font-body text-xs text-charcoal/50">{addr.street}, {addr.city} {addr.pincode}</p>
          </div>
          <button
            onClick={() => deleteMutation.mutate(addr._id)}
            className="text-charcoal/30 hover:text-copper transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button variant="outline" icon={<Plus size={14} />}>Add address</Button>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────
function SettingsTab() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const updateMutation = useMutation({
    mutationFn: () => api.patch('/users/me', { name, phone }),
  });

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gold/12 rounded-2xl p-5 space-y-4">
        <h3 className="font-heading text-lg text-primary flex items-center gap-2"><User size={16} className="text-gold" />Personal info</h3>
        <Input label="Full name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Email" value={user?.email ?? ''} disabled hint="Email cannot be changed" />
        <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending} size="sm">
          Save changes
        </Button>
      </div>

      <div className="bg-white border border-gold/12 rounded-2xl p-5 space-y-3">
        <h3 className="font-heading text-lg text-primary flex items-center gap-2"><Bell size={16} className="text-gold" />Notifications</h3>
        {[
          { label: 'Order updates', desc: 'Real-time order status notifications' },
          { label: 'Promotions', desc: 'Deals and offers from restaurants' },
          { label: 'Loyalty milestones', desc: 'When you earn or level up' },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center justify-between py-2">
            <div>
              <p className="font-body text-sm text-primary">{label}</p>
              <p className="font-body text-xs text-charcoal/40">{desc}</p>
            </div>
            <div className="w-11 h-6 rounded-full bg-primary relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-6 shadow-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gold/12 rounded-2xl p-5">
        <h3 className="font-heading text-lg text-primary flex items-center gap-2 mb-3"><Lock size={16} className="text-gold" />Security</h3>
        <Button variant="outline" size="sm">Change password</Button>
      </div>

      <Button variant="danger" icon={<LogOut size={14} />} onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>((searchParams.get('tab') as ProfileTab) ?? 'orders');
  const { user } = useAuth();

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <motion.div {...pageVariants}>
      <PageLayout>
        {/* Profile header */}
        <div className="bg-primary py-10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" animate="show" variants={stagger} className="flex items-center gap-5">
              <motion.div variants={fadeUp}>
                <Avatar name={user?.name ?? 'User'} src={user?.avatar} size="lg" />
              </motion.div>
              <div>
                <motion.h1 variants={fadeUp} className="font-heading text-3xl text-cream">{user?.name}</motion.h1>
                <motion.p variants={fadeUp} className="font-body text-sm text-cream/50 mt-0.5">{user?.email}</motion.p>
                <motion.div variants={fadeUp} className="flex items-center gap-2 mt-2">
                  <Badge variant="gold" size="sm">Member</Badge>
                  <span className="font-body text-xs text-cream/40">since {user ? new Date().getFullYear() : '—'}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="bg-cream border-b border-gold/10 sticky top-16 z-20">
          <div className="max-w-4xl mx-auto px-2 sm:px-6">
            <div className="flex overflow-x-auto no-scrollbar gap-0">
              {TABS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-body whitespace-nowrap transition-colors ${
                    activeTab === key ? 'text-primary font-medium' : 'text-charcoal/50 hover:text-primary'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {activeTab === key && (
                    <motion.div layoutId="profile-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'reservations' && <ReservationsTab />}
              {activeTab === 'loyalty' && <LoyaltyTab />}
              {activeTab === 'addresses' && <AddressesTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageLayout>
    </motion.div>
  );
}
