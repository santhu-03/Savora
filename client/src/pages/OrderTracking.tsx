import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, ChefHat, PackageCheck, Bike, Phone, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { pageVariants } from '@/lib/motion';
import { useSocketEvent } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

type OrderStatus = Order['status'];

const STEPS: { status: OrderStatus; icon: typeof CheckCircle2; label: string; desc: string }[] = [
  { status: 'confirmed', icon: CheckCircle2, label: 'Confirmed', desc: 'Order received by restaurant' },
  { status: 'preparing', icon: ChefHat, label: 'Preparing', desc: 'Your food is being prepared' },
  { status: 'ready', icon: PackageCheck, label: 'Ready', desc: 'Your order is ready' },
  { status: 'served', icon: Bike, label: 'Served', desc: 'Enjoy your meal!' },
];

const STATUS_ORDER: OrderStatus[] = ['confirmed', 'preparing', 'ready', 'served', 'completed'];

function statusIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function Countdown({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const target = new Date(targetTime).getTime();
    const update = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (remaining === 0) return null;

  return (
    <div className="flex items-center gap-2 text-primary">
      <Clock size={15} className="text-gold shrink-0" />
      <span className="font-heading text-lg">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      <span className="font-body text-xs text-charcoal/50">estimated</span>
    </div>
  );
}

function TrackingStep({
  step,
  index,
  currentIndex,
}: {
  step: typeof STEPS[number];
  index: number;
  currentIndex: number;
}) {
  const isDone = index < currentIndex;
  const isActive = index === currentIndex;

  return (
    <div className="flex gap-4">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isDone ? '#260B10' : isActive ? '#BF8B5E' : '#E5E0D8',
            borderColor: isDone ? '#260B10' : isActive ? '#BF8B5E' : '#E5E0D8',
            scale: isActive ? 1.1 : 1,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0"
        >
          <step.icon size={18} className={isDone || isActive ? 'text-cream' : 'text-charcoal/30'} />
        </motion.div>
        {index < STEPS.length - 1 && (
          <div className="w-0.5 flex-1 min-h-6 mt-2">
            <motion.div
              className="h-full w-full bg-primary origin-top"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: isDone ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <div className="h-full w-full bg-charcoal/10 -mt-full" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className={`pb-6 ${index === STEPS.length - 1 ? 'pb-0' : ''}`}>
        <p className={`font-body font-semibold text-sm ${isDone || isActive ? 'text-primary' : 'text-charcoal/35'}`}>
          {step.label}
        </p>
        <p className={`font-body text-xs mt-0.5 ${isActive ? 'text-charcoal/60' : 'text-charcoal/35'}`}>
          {step.desc}
        </p>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 text-gold text-xs font-body font-medium rounded-full border border-gold/20">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              In progress
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<{ data: Order }>(`/orders/${id}`).then(r => r.data.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  useSocketEvent<{ orderId: string; status: OrderStatus }>('order_status_updated', ({ orderId, status }) => {
    if (orderId === id) setLiveStatus(status);
  });

  const currentStatus = liveStatus ?? order?.status ?? 'confirmed';
  const currentIndex = statusIndex(currentStatus as OrderStatus);
  const isCompleted = currentStatus === 'completed' || currentStatus === 'served';

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  if (!order) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <p className="font-body text-charcoal/40 mb-4">Order not found.</p>
          <Link to="/profile" className="font-body text-sm text-gold">View my orders →</Link>
        </div>
      </PageLayout>
    );
  }

  const restaurant = typeof order.restaurant !== 'string' ? order.restaurant : null;

  return (
    <motion.div {...pageVariants}>
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="font-heading text-3xl text-primary">Order #{order.orderNumber}</h1>
              <Badge variant={isCompleted ? 'green' : 'gold'}>
                {currentStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
            {restaurant && (
              <p className="font-body text-sm text-charcoal/50">
                {restaurant.name} · {formatDate(order.placedAt)}
              </p>
            )}
          </div>

          {/* Live status card */}
          <div className="bg-white border border-gold/12 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-body text-xs text-charcoal/40 uppercase tracking-widest mb-1">Status</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStatus}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="font-heading text-2xl text-primary capitalize"
                  >
                    {currentStatus.replace(/_/g, ' ')}
                  </motion.p>
                </AnimatePresence>
              </div>
              {order.estimatedReadyTime && !isCompleted && (
                <Countdown targetTime={new Date(Date.now() + order.estimatedReadyTime * 60000).toISOString()} />
              )}
            </div>

            {/* Stepper */}
            <div className="space-y-0">
              {STEPS.map((step, i) => (
                <TrackingStep key={step.status} step={step} index={i} currentIndex={currentIndex} />
              ))}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white border border-gold/12 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gold/10">
              <h2 className="font-body font-semibold text-primary">Items ordered</h2>
            </div>
            <div className="divide-y divide-gold/8">
              {order.items.map((item, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-body text-sm text-primary">{item.name}</p>
                    <p className="font-body text-xs text-charcoal/40">×{item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        item.status === 'ready' ? 'green' :
                        item.status === 'preparing' ? 'gold' :
                        'neutral'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                    <span className="font-body text-sm font-semibold text-primary">{formatCurrency(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gold/10 flex justify-between">
              <span className="font-body font-semibold text-primary">Total</span>
              <span className="font-body font-bold text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {restaurant && (
              <a
                href={`tel:${restaurant.contact?.phone}`}
                className="flex items-center justify-center gap-2 flex-1 py-3 border border-gold/20 text-primary text-sm font-body rounded-xl hover:border-gold/40 transition-colors"
              >
                <Phone size={15} className="text-gold" />
                Call restaurant
              </a>
            )}
            <Link
              to="/profile?tab=orders"
              className="flex items-center justify-center gap-2 flex-1 py-3 border border-gold/20 text-primary text-sm font-body rounded-xl hover:border-gold/40 transition-colors"
            >
              All orders <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </PageLayout>
    </motion.div>
  );
}
