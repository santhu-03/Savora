import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, QrCode, ShoppingBag, CalendarDays, Gift,
  Star, Quote, ArrowRight, UtensilsCrossed, Clock, Sparkles,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { api } from '@/lib/api';
import type { Restaurant } from '@/types';

// ─── Hero ─────────────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-[#1a0710] to-primary" />
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: 'radial-gradient(circle, #BF8B5E, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full opacity-15 blur-[80px]" style={{ background: 'radial-gradient(circle, #A6523F, transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#BF8B5E 1px, transparent 1px), linear-gradient(90deg, #BF8B5E 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/60" />

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <span className="h-px w-12 bg-gold/40" />
          <span className="font-body text-gold/70 text-xs uppercase tracking-[0.35em]">
            Curated Dining Experiences
          </span>
          <span className="h-px w-12 bg-gold/40" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-heading font-semibold text-cream leading-[1.02] mb-4"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
        >
          Experience Dining,
          <br />
          <span className="italic text-gold-gradient">Redefined</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
          className="font-body text-cream/50 text-lg max-w-xl mx-auto leading-relaxed mb-10"
        >
          Discover handpicked restaurants, reserve the perfect table, and order with elegance — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/reservation"
            className="flex items-center gap-2 px-7 py-3.5 bg-gold text-primary font-body font-semibold text-sm rounded-xl hover:bg-gold-dark transition-colors shadow-lg shadow-gold/20"
          >
            <CalendarDays size={16} />
            Reserve a Table
          </Link>
          <Link
            to="/restaurants"
            className="flex items-center gap-2 px-7 py-3.5 border border-cream/20 text-cream/80 font-body text-sm rounded-xl hover:border-cream/40 hover:text-cream transition-colors"
          >
            <UtensilsCrossed size={16} />
            Order Online
            <ChevronRight size={14} />
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto"
        >
          {[['500+', 'Restaurants'], ['50K+', 'Happy Diners'], ['4.8★', 'Avg. Rating']].map(([val, lbl]) => (
            <div key={lbl} className="text-center">
              <div className="font-heading text-2xl text-gold">{val}</div>
              <div className="font-body text-xs text-cream/35 mt-0.5">{lbl}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-10 bg-gradient-to-b from-gold/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// ─── Services Strip ───────────────────────────────────────────
const services = [
  { icon: UtensilsCrossed, label: 'Fine Dining', desc: 'Curated restaurants' },
  { icon: QrCode, label: 'QR Ordering', desc: 'Scan & order at table' },
  { icon: CalendarDays, label: 'Reservations', desc: 'Instant table booking' },
  { icon: Gift, label: 'Loyalty Rewards', desc: 'Earn with every order' },
];

function ServicesStrip() {
  return (
    <section className="bg-primary py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {services.map(({ icon: Icon, label, desc }) => (
            <motion.div key={label} variants={fadeUp} className="text-center group">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl border border-gold/20 flex items-center justify-center bg-gold/5 group-hover:bg-gold/10 group-hover:border-gold/35 transition-colors">
                <Icon size={20} className="text-gold" />
              </div>
              <h3 className="font-heading text-lg text-cream mb-1">{label}</h3>
              <p className="font-body text-xs text-cream/40">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Featured Restaurants ─────────────────────────────────────
function FeaturedRestaurants() {
  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', 'featured'],
    queryFn: () =>
      api.get<{ data: Restaurant[] }>('/restaurants', { params: { limit: 8, featured: true } })
        .then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <motion.p variants={fadeUp} className="font-body text-gold text-xs uppercase tracking-widest mb-2">
              Handpicked for you
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-primary">
              Featured Restaurants
            </motion.h2>
          </div>
          <motion.div variants={fadeUp}>
            <Link to="/restaurants" className="flex items-center gap-2 font-body text-sm text-gold hover:text-gold-dark transition-colors">
              View all <ArrowRight size={15} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Horizontal scroll */}
        <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar snap-x snap-mandatory">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-72 snap-start"><CardSkeleton /></div>
              ))
            : (data ?? []).map(r => (
                <div key={r._id} className="shrink-0 w-72 snap-start">
                  <RestaurantCard restaurant={r} />
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────
const steps = [
  { n: '01', title: 'Discover', body: 'Browse curated restaurants by cuisine, location, or occasion. Every listing is personally vetted.' },
  { n: '02', title: 'Reserve or Order', body: 'Book a table instantly or place an order for delivery, takeaway, or dine-in via QR code at your table.' },
  { n: '03', title: 'Enjoy & Earn', body: 'Experience world-class dining and earn loyalty points with every order to unlock exclusive rewards.' },
];

function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-cream to-[#f5ede4]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.p variants={fadeUp} className="font-body text-gold text-xs uppercase tracking-widest mb-3">
            Effortlessly simple
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-primary">
            How Savora works
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-px bg-gold/20" />

          {steps.map(({ n, title, body }) => (
            <motion.div key={n} variants={fadeUp} className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center relative">
                <span className="font-heading text-xl text-gold">{n}</span>
                <div className="absolute -inset-1 rounded-full border border-gold/20" />
              </div>
              <h3 className="font-heading text-2xl text-primary mb-3">{title}</h3>
              <p className="font-body text-sm text-charcoal/55 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────
const testimonials = [
  { name: 'Priya Sharma', role: 'Food Enthusiast', rating: 5, text: 'Savora transformed how I experience dining out. The reservation flow is seamless and the restaurants are truly exceptional.' },
  { name: 'Arjun Mehta', role: 'Corporate Executive', rating: 5, text: 'The QR ordering system is genius. No more waiting for menus or the waiter — everything at my fingertips. 10/10.' },
  { name: 'Sneha Kulkarni', role: 'Food Blogger', rating: 5, text: 'Every restaurant on Savora maintains an incredible standard. I\'ve discovered so many hidden gems through this platform.' },
];

function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.p variants={fadeUp} className="font-body text-gold text-xs uppercase tracking-widest mb-3">
            What our guests say
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl text-primary">
            Loved by food lovers
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map(({ name, role, rating, text }) => (
            <motion.div key={name} variants={fadeUp}>
              <div className="bg-white border border-gold/12 rounded-2xl p-6 h-full shadow-sm hover:shadow-md hover:border-gold/25 transition-all duration-300">
                <Quote size={28} className="text-gold/30 mb-4" />
                <p className="font-body text-sm text-charcoal/70 leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={13} className="fill-gold text-gold" />
                  ))}
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-primary">{name}</p>
                  <p className="font-body text-xs text-charcoal/40">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-primary rounded-3xl px-8 py-14 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, #BF8B5E, transparent)' }} />
          <Sparkles size={28} className="text-gold mx-auto mb-4 relative" />
          <h2 className="font-heading text-4xl md:text-5xl text-cream mb-4 relative">
            Start your culinary journey
          </h2>
          <p className="font-body text-cream/45 text-base mb-8 max-w-md mx-auto relative">
            Join 50,000+ food lovers discovering exceptional dining through Savora.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <Link
              to="/register"
              className="flex items-center gap-2 px-7 py-3.5 bg-gold text-primary font-body font-semibold text-sm rounded-xl hover:bg-gold-dark transition-colors"
            >
              Create free account
            </Link>
            <Link
              to="/restaurants"
              className="flex items-center gap-2 px-7 py-3.5 border border-cream/15 text-cream/70 font-body text-sm rounded-xl hover:border-cream/30 hover:text-cream transition-colors"
            >
              Browse restaurants <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8">
            {['Free to join', 'No subscription', 'Instant rewards'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gold/50" />
                <span className="font-body text-xs text-cream/35">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Quick order strip ────────────────────────────────────────
function QuickActions() {
  return (
    <section className="py-14 px-4 sm:px-6 bg-[#f5ede4]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            { icon: ShoppingBag, title: 'Order Now', desc: 'Food delivered to your door', href: '/restaurants', cta: 'Browse restaurants' },
            { icon: CalendarDays, title: 'Reserve a Table', desc: 'Secure your spot in minutes', href: '/reservation', cta: 'Make reservation' },
            { icon: Clock, title: 'QR Table Order', desc: 'Scan, order, relax at your table', href: '/menu/demo', cta: 'See how it works' },
          ].map(({ icon: Icon, title, desc, href, cta }) => (
            <motion.div key={title} variants={fadeUp}>
              <Link to={href} className="block p-6 bg-white rounded-2xl border border-gold/10 hover:border-gold/25 hover:shadow-md transition-all duration-300 group">
                <div className="w-10 h-10 mb-4 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon size={18} className="text-primary" />
                </div>
                <h3 className="font-heading text-xl text-primary mb-1">{title}</h3>
                <p className="font-body text-xs text-charcoal/50 mb-4">{desc}</p>
                <span className="font-body text-xs font-medium text-gold flex items-center gap-1 group-hover:gap-2 transition-all">
                  {cta} <ArrowRight size={12} />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function Home() {
  return (
    <motion.div {...pageVariants}>
      <PageLayout hideFooter={false}>
        {/* Hero needs to go outside pt-16 constraint */}
        <div className="-mt-16">
          <Hero />
        </div>
        <ServicesStrip />
        <FeaturedRestaurants />
        <HowItWorks />
        <QuickActions />
        <Testimonials />
        <CTABanner />
      </PageLayout>
    </motion.div>
  );
}
