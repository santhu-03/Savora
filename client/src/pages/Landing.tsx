import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Menu, X, ChevronDown, Play, Star, Check, ArrowRight,
  Palette, Layers, Globe, LayoutDashboard, Smartphone,
  CalendarDays, QrCode, CreditCard, BarChart3,
  Building2, UtensilsCrossed, TrendingUp,
  Twitter, Instagram, Linkedin, Mail, Zap,
} from 'lucide-react';

// ─── Marquee keyframes injected once ─────────────────────────────
const MARQUEE_CSS = `
  @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .marquee-track{animation:marquee 28s linear infinite}
  .marquee-track:hover{animation-play-state:paused}
`;

// ─── Motion presets ───────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as const;
const revealUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } };
const revealLeft  = { hidden: { opacity: 0, x: -40 }, show: { opacity: 1, x: 0, transition: { duration: 0.65, ease } } };
const revealRight = { hidden: { opacity: 0, x: 40  }, show: { opacity: 1, x: 0, transition: { duration: 0.65, ease } } };
const stagger = (delay = 0.1) => ({ hidden: {}, show: { transition: { staggerChildren: delay, delayChildren: 0.05 } } });

// ─── Data ─────────────────────────────────────────────────────────
const SERVICES = [
  { icon: Palette,         name: 'Branding',          desc: 'Identity systems that command premium positioning' },
  { icon: Layers,          name: 'UI/UX Design',       desc: 'Interfaces guests return to, intuitively' },
  { icon: Globe,           name: 'Website',            desc: 'High-conversion presence with reservation flows' },
  { icon: LayoutDashboard, name: 'Admin Dashboard',    desc: 'Real-time control over every operation metric' },
  { icon: Smartphone,      name: 'Mobile App',         desc: 'Native iOS & Android for staff and guests' },
  { icon: CalendarDays,    name: 'Table Booking',      desc: 'Smart reservations with floor-plan management' },
  { icon: QrCode,          name: 'QR Menu',            desc: 'Contactless menus that drive upsells instantly' },
  { icon: CreditCard,      name: 'Payments',           desc: 'Stripe-powered checkout in seconds, not minutes' },
  { icon: BarChart3,       name: 'Analytics',          desc: 'Revenue intelligence to optimise every shift' },
];

const FEATURES = [
  {
    eyebrow:     'Online Ordering',
    title:       'Orders that run themselves',
    description: 'Let guests browse, customise, and checkout from their phone — dine-in, takeaway, or delivery — with live status updates pushed via Socket.io.',
    bullets:     ['Stripe payment integration', 'Real-time kitchen sync', 'Guest order tracking', 'Promo code & loyalty rewards'],
    side:        'right' as const,
  },
  {
    eyebrow:     'Kitchen Display System',
    title:       'Zero tickets lost, ever',
    description: 'Your kitchen team sees every order the moment it lands — colour-coded by urgency, with per-item acknowledgement and auto-advance when all items are marked ready.',
    bullets:     ['Live socket-driven updates', 'Urgency colour-coding', 'Item-level status tracking', 'Audio alerts for new orders'],
    side:        'left' as const,
  },
  {
    eyebrow:     'Analytics & Revenue',
    title:       'Data that earns its keep',
    description: 'From peak-hour heat maps to per-server performance, every metric you need to cut waste and grow revenue is one click away.',
    bullets:     ['Revenue & cover trends', 'Menu item performance', 'Staff & table efficiency', 'Exportable CSV reports'],
    side:        'right' as const,
  },
];

const STEPS = [
  { icon: Building2,       num: '01', title: 'Register your restaurant', desc: 'Add your menu, upload photos, and configure tables in under 10 minutes.' },
  { icon: UtensilsCrossed, num: '02', title: 'Set up menu & tables',     desc: 'Drag-and-drop floor plan, category management, and QR code generation built in.' },
  { icon: TrendingUp,      num: '03', title: 'Start accepting orders',    desc: 'Go live immediately — orders flow to the kitchen, payments settle automatically.' },
];

const CLIENTS = [
  'Marriott', 'Taj Hotels', 'Oberoi Grand', 'ITC Hotels',
  'The Leela', 'Hyatt Regency', 'Sheraton', 'Radisson Blu',
  'JW Marriott', 'Four Seasons', 'Conrad', 'Novotel',
];

const TESTIMONIALS = [
  {
    initials: 'VM', name: 'Vikram Malhotra', rest: 'The Spice Garden, Mumbai',
    quote: 'Our kitchen efficiency jumped 40% in two months. The KDS alone paid for the subscription.',
    rating: 5,
  },
  {
    initials: 'PK', name: 'Priya Krishnan', rest: 'Café Soleil, Bangalore',
    quote: "We eliminated paper tickets entirely. Guests love the QR menu — it's beautiful and instant.",
    rating: 5,
  },
  {
    initials: 'RS', name: 'Rahul Sharma', rest: 'The Grand Pavilion, Delhi',
    quote: 'Revenue analytics revealed our Tuesday dinner was underperforming. We fixed it in a week.',
    rating: 5,
  },
];

const PRICING = [
  {
    name: 'Starter', price: 0, period: '', tag: null,
    desc: 'Perfect to explore Savora risk-free.',
    features: ['Up to 50 orders / month', '1 location', 'QR menu', 'Basic analytics', 'Email support'],
    cta: 'Get started free',
  },
  {
    name: 'Professional', basePrice: 2999, tag: 'Most Popular',
    desc: 'Everything a growing restaurant needs.',
    features: ['Unlimited orders', '3 locations', 'Mobile app', 'Advanced analytics', 'Priority support', 'Loyalty rewards', 'Custom QR cards'],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise', price: null, tag: null,
    desc: 'Full platform, white-label, dedicated team.',
    features: ['Unlimited locations', 'White-label branding', 'API access', 'Dedicated CSM', 'SLA guarantee', 'Custom integrations', 'Staff training'],
    cta: 'Talk to sales',
  },
];

const DEMO_TABS = [
  { id: 'customer',  label: 'Customer View'    },
  { id: 'admin',     label: 'Admin Dashboard'  },
  { id: 'kitchen',   label: 'Kitchen Display'  },
  { id: 'mobile',    label: 'Mobile App'       },
];

// ─── CountUp hook ─────────────────────────────────────────────────
function useCountUp(target: number, ref: React.RefObject<Element>, duration = 1800) {
  const [count, setCount] = useState(0);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setCount(Math.floor(ease * target));
      if (pct < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return count;
}

// ─── Section label ────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.3em] text-gold mb-3">
      <span className="w-5 h-px bg-gold/50" />
      {children}
      <span className="w-5 h-px bg-gold/50" />
    </p>
  );
}

// ─── Browser frame mockup ─────────────────────────────────────────
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
      <div className="h-9 flex items-center gap-1.5 px-4" style={{ background: '#1a0d10' }}>
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-amber-400/50" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
        <div className="ml-3 flex-1 h-5 rounded-md max-w-[180px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ background: '#150a0d' }}>{children}</div>
    </div>
  );
}

// ─── Phone frame mockup ───────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-52" style={{ filter: 'drop-shadow(0 24px 60px rgba(0,0,0,0.7))' }}>
      <div className="rounded-[2.5rem] overflow-hidden border-4 border-white/10" style={{ background: '#150a0d' }}>
        <div className="h-7 flex items-center justify-center" style={{ background: '#0d0508' }}>
          <div className="w-16 h-4 rounded-full" style={{ background: '#0d0508', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        {children}
        <div className="h-6" style={{ background: '#0d0508' }} />
      </div>
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────
function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < n ? '#BF8B5E' : 'transparent'} color={i < n ? '#BF8B5E' : 'rgba(191,139,94,0.3)'} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 1. NAVBAR
// ═══════════════════════════════════════════════════════════════════
function LandingNavbar({ onDemo }: { onDemo: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobile] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Features', 'Services', 'Clients', 'Pricing', 'Contact'];
  const scrollTo = (id: string) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
    setMobile(false);
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(38,11,16,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(191,139,94,0.1)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="#" className="font-heading text-2xl tracking-[0.2em] text-gold leading-none select-none">
          SAVORA
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <button
              key={l}
              onClick={() => scrollTo(l)}
              className="font-body text-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              {l}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onDemo}
            className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97]"
            style={{ background: '#A6523F', color: '#fff' }}
          >
            Request Demo
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors"
          onClick={() => setMobile(v => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease }}
            className="md:hidden overflow-hidden border-t"
            style={{ background: 'rgba(38,11,16,0.97)', borderColor: 'rgba(191,139,94,0.12)' }}
          >
            <div className="px-5 py-5 flex flex-col gap-4">
              {links.map(l => (
                <button key={l} onClick={() => scrollTo(l)}
                  className="text-left font-body text-base text-white/70 hover:text-white transition-colors py-1">
                  {l}
                </button>
              ))}
              <button
                onClick={() => { onDemo(); setMobile(false); }}
                className="mt-2 w-full py-3 rounded-xl font-body text-sm font-semibold text-white"
                style={{ background: '#A6523F' }}
              >
                Request Demo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. HERO
// ═══════════════════════════════════════════════════════════════════
const HERO_WORDS = ['The', 'Future', 'of', 'Restaurant', 'Management'];


function HeroSection({ onDemo, onTrial }: { onDemo: () => void; onTrial: () => void }) {
  const statsRef = useRef<HTMLDivElement>(null);
  const c500 = useCountUp(500, statsRef as React.RefObject<Element>);
  const c1M  = useCountUp(1000000, statsRef as React.RefObject<Element>);
  const c50  = useCountUp(50, statsRef as React.RefObject<Element>);

  return (
    <section id="hero" className="relative min-h-screen flex flex-col" style={{ background: '#260B10' }}>
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #BF8B5E, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #A6523F, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #BF8B5E, transparent 70%)', filter: 'blur(70px)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(191,139,94,1) 1px,transparent 1px),linear-gradient(90deg,rgba(191,139,94,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-28 pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full font-body text-xs text-gold border"
          style={{ background: 'rgba(191,139,94,0.08)', borderColor: 'rgba(191,139,94,0.25)' }}
        >
          <Zap size={12} fill="currentColor" /> Restaurant Management Platform
        </motion.div>

        {/* Headline — word by word */}
        <div className="overflow-hidden mb-6 max-w-4xl mx-auto">
          <h1 className="font-heading leading-[1.05] text-white" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            {HERO_WORDS.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease }}
                className="inline-block mr-[0.25em]"
              >
                {i === 3 || i === 4 ? (
                  <span className="text-gold-gradient">{word}</span>
                ) : word}
              </motion.span>
            ))}
          </h1>
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease }}
          className="font-body text-lg md:text-xl mb-10 max-w-2xl leading-relaxed"
          style={{ color: 'rgba(191,139,94,0.75)' }}
        >
          From QR menus to kitchen displays, reservations to real-time analytics —
          Savora is the complete operating system for modern hospitality.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={onTrial}
            className="font-body font-semibold text-sm px-7 py-4 rounded-2xl transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #BF8B5E, #a67748)', color: '#260B10', boxShadow: '0 8px 24px rgba(191,139,94,0.3)' }}
          >
            Start Free Trial <ArrowRight size={15} className="inline ml-1" />
          </button>
          <button
            onClick={onDemo}
            className="inline-flex items-center gap-2.5 font-body text-sm font-medium px-7 py-4 rounded-2xl border transition-all duration-200 active:scale-[0.97] hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)' }}
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(191,139,94,0.2)' }}>
              <Play size={12} fill="currentColor" className="text-gold ml-0.5" />
            </span>
            Watch Demo
          </button>
        </motion.div>

        {/* Hero mockup strip */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.1, ease }}
          className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border shadow-2xl"
          style={{ borderColor: 'rgba(191,139,94,0.15)', background: '#150a0d' }}
        >
          {/* Fake browser chrome */}
          <div className="h-10 flex items-center gap-2 px-4 border-b" style={{ background: '#1a0d10', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-amber-400/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
            <div className="ml-3 flex-1 h-5 rounded-md max-w-[260px] flex items-center px-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="font-body text-[10px]" style={{ color: 'rgba(191,139,94,0.4)' }}>app.savora.in/dashboard</span>
            </div>
          </div>
          {/* Dashboard preview */}
          <div className="p-5 grid grid-cols-4 gap-3">
            {['₹4.2L', '148', '32', '4.9★'].map((v, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(191,139,94,0.08)' }}>
                <div className="h-1.5 w-12 rounded mb-2" style={{ background: 'rgba(191,139,94,0.2)' }} />
                <p className="font-heading text-xl text-white">{v}</p>
                <div className="h-1 w-8 rounded mt-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
            <div className="col-span-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(191,139,94,0.08)' }}>
              <div className="flex items-end gap-1.5 h-20">
                {[40,65,50,80,60,90,75,85,70,95,68,88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `rgba(191,139,94,${0.15 + h/400})` }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(191,139,94,0.08)' }}>
              {['Dine-in','Takeaway','Delivery'].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ['#BF8B5E','#A6523F','#7A5C2E'][i] }} />
                  <span className="font-body text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll arrow */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="relative z-10 flex justify-center pb-8"
        style={{ color: 'rgba(191,139,94,0.4)' }}
      >
        <ChevronDown size={22} />
      </motion.div>

      {/* Stats strip */}
      <div ref={statsRef} className="relative z-10 border-t" style={{ borderColor: 'rgba(191,139,94,0.12)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Restaurants',  value: c500,   suffix: '+' },
            { label: 'Orders served', value: c1M,   suffix: '+', fmt: true },
            { label: 'Cities',       value: c50,    suffix: '+' },
            { label: 'Rating',       value: 4.9,    suffix: '★', static: true },
          ].map(({ label, value, suffix, fmt, static: s }) => (
            <div key={label} className="text-center">
              <p className="font-heading text-3xl md:text-4xl text-white mb-1">
                {s ? value : fmt ? `${Math.floor((value as number)/1000)}K` : value}{suffix}
              </p>
              <p className="font-body text-xs" style={{ color: 'rgba(191,139,94,0.55)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. SERVICES
// ═══════════════════════════════════════════════════════════════════
function ServicesSection() {
  return (
    <section id="services" className="section" style={{ background: '#0d0508' }}>
      <div className="container-xl">
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          variants={stagger(0.12)}
        >
          <motion.div variants={revealUp}><Eyebrow>What we do</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Every tool your <span className="text-gold-gradient">restaurant needs</span>
          </motion.h2>
          <motion.p variants={revealUp} className="font-body max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            Eight integrated services. One platform. Zero friction.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          variants={stagger(0.07)}
        >
          {SERVICES.map(({ icon: Icon, name, desc }) => (
            <motion.div
              key={name}
              variants={revealUp}
              className="group relative rounded-2xl p-6 cursor-default transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(38,11,16,0.7)',
                border: '1px solid rgba(191,139,94,0.12)',
              }}
              whileHover={{ borderColor: 'rgba(191,139,94,0.35)', boxShadow: '0 0 32px rgba(191,139,94,0.08)' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{ background: 'rgba(191,139,94,0.1)' }}
              >
                <Icon size={20} className="text-gold transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="font-heading text-xl text-white mb-2">{name}</h3>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>{desc}</p>
              {/* Glow dot on hover */}
              <div
                className="absolute top-5 right-5 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: '#BF8B5E', boxShadow: '0 0 8px #BF8B5E' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. FEATURES
// ═══════════════════════════════════════════════════════════════════
function FeatureMockupOnlineOrder() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="flex gap-2 mb-3">
          {['All','Starters','Mains','Desserts'].map((c,i) => (
            <div key={c} className="px-3 py-1 rounded-full font-body text-[9px]"
              style={{ background: i===1 ? '#BF8B5E' : 'rgba(255,255,255,0.05)', color: i===1 ? '#260B10' : 'rgba(255,255,255,0.4)' }}>
              {c}
            </div>
          ))}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-12 h-12 rounded-lg flex-shrink-0" style={{ background: 'rgba(191,139,94,0.1)' }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <div className="h-2 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="h-7 w-16 rounded-lg flex items-center justify-center" style={{ background: 'rgba(191,139,94,0.2)' }}>
              <span className="font-body text-[9px] text-gold">+ Add</span>
            </div>
          </div>
        ))}
        <div className="h-10 rounded-xl flex items-center justify-between px-3" style={{ background: '#BF8B5E' }}>
          <span className="font-body text-[10px] font-semibold" style={{ color: '#260B10' }}>3 items · ₹1,240</span>
          <span className="font-body text-[10px] font-semibold" style={{ color: '#260B10' }}>View cart →</span>
        </div>
      </div>
    </BrowserFrame>
  );
}

function FeatureMockupKitchen() {
  return (
    <BrowserFrame>
      <div className="p-4 grid grid-cols-3 gap-2">
        {[
          { id: 'SVR-091', table: 'T-03', status: 'incoming', elapsed: '2:30', items: ['Risotto ×2','Duck Breast'] },
          { id: 'SVR-090', table: 'T-07', status: 'preparing', elapsed: '8:15', items: ['Arancini ×1','Sea Bass','Fondant ×2'] },
          { id: 'SVR-089', table: 'T-01', status: 'ready', elapsed: '14:00', items: ['Truffle Fries ×2'] },
        ].map(t => (
          <div key={t.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="h-1 w-full" style={{ background: t.status==='incoming'?'#f59e0b':t.status==='preparing'?'#3b82f6':'#22c55e' }} />
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-body text-[8px] font-bold text-white">{t.table}</span>
                <span className="font-body text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.elapsed}</span>
              </div>
              {t.items.map(item => (
                <div key={item} className="font-body text-[8px] py-1 border-b" style={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.05)' }}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function FeatureMockupAnalytics() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {['₹4.2L','148','32'].map((v,i) => (
            <div key={i} className="p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(191,139,94,0.08)' }}>
              <p className="font-heading text-lg text-white">{v}</p>
              <div className="h-1.5 rounded mx-auto mt-1 w-12" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(191,139,94,0.07)' }}>
          <div className="flex items-end gap-1 h-16">
            {[35,55,42,70,58,82,65,78,60,90,72,86].map((h,i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `rgba(191,139,94,${0.12+h/300})` }} />
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {['Saffron Risotto · ₹32,400','Pan-Seared Duck · ₹28,800','Truffle Arancini · ₹18,600'].map((item,i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${[90,80,60][i]}%`, background: '#BF8B5E', opacity: 0.5+i*0.15 }} />
              </div>
              <span className="font-body text-[8px] text-white/40 w-28 text-right">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function FeaturesSection() {
  const MOCKUPS = [FeatureMockupOnlineOrder, FeatureMockupKitchen, FeatureMockupAnalytics];

  return (
    <section id="features" className="py-24 px-4 sm:px-6" style={{ background: '#260B10' }}>
      <div className="container-xl">
        <motion.div
          className="text-center mb-20"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          variants={stagger()}
        >
          <motion.div variants={revealUp}><Eyebrow>Platform</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-white"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Everything you <span className="text-gold-gradient">need</span>
          </motion.h2>
        </motion.div>

        <div className="space-y-28">
          {FEATURES.map((f, i) => {
            const Mockup = MOCKUPS[i];
            const isLeft = f.side === 'left';
            return (
              <div key={f.eyebrow} className={`grid md:grid-cols-2 gap-12 items-center ${isLeft ? '' : ''}`}>
                {/* Text */}
                <motion.div
                  className={isLeft ? 'md:order-2' : ''}
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                  variants={isLeft ? revealRight : revealLeft}
                >
                  <Eyebrow>{f.eyebrow}</Eyebrow>
                  <h3 className="font-heading text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                    {f.title}
                  </h3>
                  <p className="font-body text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {f.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {f.bullets.map(b => (
                      <li key={b} className="flex items-center gap-3 font-body text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(191,139,94,0.15)' }}>
                          <Check size={11} className="text-gold" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a href="#" className="inline-flex items-center gap-2 font-body text-sm font-medium text-gold hover:text-gold-light transition-colors group">
                    Learn more <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-150" />
                  </a>
                </motion.div>

                {/* Mockup */}
                <motion.div
                  className={isLeft ? 'md:order-1' : ''}
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
                  variants={isLeft ? revealLeft : revealRight}
                >
                  <Mockup />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════
function HowItWorksSection() {
  return (
    <section id="howitworks" className="section" style={{ background: '#f9f3ec' }}>
      <div className="container-xl">
        <motion.div
          className="text-center mb-16"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          variants={stagger()}
        >
          <motion.div variants={revealUp}><Eyebrow>Process</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-primary"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Up and running <span className="italic text-copper">in one afternoon</span>
          </motion.h2>
        </motion.div>

        <motion.div
          className="relative grid md:grid-cols-3 gap-8 md:gap-4"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          variants={stagger(0.14)}
        >
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(191,139,94,0.4), transparent)' }} />

          {STEPS.map(({ icon: Icon, num, title, desc }) => (
            <motion.div key={num} variants={revealUp} className="relative flex flex-col items-center text-center">
              {/* Number badge */}
              <div className="relative mb-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: '#260B10', boxShadow: '0 8px 32px rgba(38,11,16,0.25)' }}
                >
                  <Icon size={28} className="text-gold" />
                </div>
                <span
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-heading text-xs font-bold"
                  style={{ background: '#BF8B5E', color: '#260B10' }}
                >
                  {num}
                </span>
              </div>
              <h3 className="font-heading text-2xl text-primary mb-3">{title}</h3>
              <p className="font-body text-sm leading-relaxed text-charcoal/55 max-w-xs">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. CLIENTS
// ═══════════════════════════════════════════════════════════════════
function ClientsSection() {
  const doubled = [...CLIENTS, ...CLIENTS];

  return (
    <section id="clients" className="section" style={{ background: '#0d0508' }}>
      <div className="container-xl">
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger()}
        >
          <motion.div variants={revealUp}><Eyebrow>Trusted by</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-white mb-2"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Restaurants · Cafés · Hotels
          </motion.h2>
          <motion.p variants={revealUp} className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Joined by 500+ establishments across India
          </motion.p>
        </motion.div>

        {/* Infinite logo strip */}
        <div className="relative overflow-hidden mb-16" style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
          <div className="marquee-track flex gap-12 whitespace-nowrap py-4">
            {doubled.map((logo, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 font-heading text-base tracking-widest flex-shrink-0"
                style={{ color: 'rgba(191,139,94,0.35)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(191,139,94,0.25)' }} />
                {logo.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <motion.div
          className="grid md:grid-cols-3 gap-5"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          variants={stagger(0.12)}
        >
          {TESTIMONIALS.map(({ initials, name, rest, quote, rating }) => (
            <motion.div
              key={name}
              variants={revealUp}
              className="rounded-2xl p-6 flex flex-col"
              style={{ background: 'rgba(38,11,16,0.8)', border: '1px solid rgba(191,139,94,0.12)' }}
            >
              <Stars n={rating} />
              <p className="font-body text-sm leading-relaxed mt-4 mb-6 flex-1 italic" style={{ color: 'rgba(255,255,255,0.6)' }}>
                "{quote}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-heading text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #BF8B5E, #a67748)', color: '#260B10' }}
                >
                  {initials}
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-white">{name}</p>
                  <p className="font-body text-xs" style={{ color: 'rgba(191,139,94,0.55)' }}>{rest}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. PRICING
// ═══════════════════════════════════════════════════════════════════
function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="section" style={{ background: '#FDF8F3' }}>
      <div className="container-xl">
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger()}
        >
          <motion.div variants={revealUp}><Eyebrow>Pricing</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-primary mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            Simple, transparent <span className="text-gold-gradient">pricing</span>
          </motion.h2>
          {/* Toggle */}
          <motion.div variants={revealUp} className="inline-flex items-center gap-4 mt-4">
            <span className={`font-body text-sm transition-colors ${!annual ? 'text-primary font-semibold' : 'text-charcoal/40'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{ background: annual ? '#260B10' : 'rgba(38,11,16,0.15)' }}
            >
              <motion.div
                animate={{ x: annual ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-gold"
              />
            </button>
            <span className={`font-body text-sm transition-colors ${annual ? 'text-primary font-semibold' : 'text-charcoal/40'}`}>
              Annual <span className="text-copper font-semibold">–20%</span>
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-5 items-stretch"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          variants={stagger(0.1)}
        >
          {PRICING.map(({ name, price, basePrice, tag, desc, features, cta }) => {
            const displayPrice = basePrice
              ? (annual ? Math.round(basePrice * 0.8) : basePrice)
              : price;
            const isPopular = tag === 'Most Popular';
            return (
              <motion.div
                key={name}
                variants={revealUp}
                className="relative rounded-3xl p-7 flex flex-col"
                style={{
                  background:   isPopular ? '#260B10' : '#fff',
                  border:       isPopular ? '1px solid rgba(191,139,94,0.3)' : '1px solid rgba(38,11,16,0.08)',
                  boxShadow:    isPopular ? '0 24px 60px rgba(38,11,16,0.35)' : '0 2px 12px rgba(38,11,16,0.06)',
                  transform:    isPopular ? 'scale(1.03)' : undefined,
                }}
              >
                {tag && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-body text-xs font-bold"
                    style={{ background: '#BF8B5E', color: '#260B10' }}
                  >
                    {tag}
                  </div>
                )}

                <p className={`font-body text-xs uppercase tracking-widest mb-3 ${isPopular ? 'text-gold/60' : 'text-charcoal/40'}`}>{name}</p>

                <div className="mb-2">
                  {displayPrice === 0 ? (
                    <p className={`font-heading text-5xl ${isPopular ? 'text-white' : 'text-primary'}`}>Free</p>
                  ) : displayPrice === null ? (
                    <p className={`font-heading text-4xl ${isPopular ? 'text-white' : 'text-primary'}`}>Custom</p>
                  ) : (
                    <p className={`font-heading ${isPopular ? 'text-white' : 'text-primary'}`} style={{ fontSize: '2.75rem' }}>
                      ₹{(displayPrice as number).toLocaleString('en-IN')}
                      <span className={`font-body text-sm ml-1 ${isPopular ? 'text-white/40' : 'text-charcoal/35'}`}>/mo</span>
                    </p>
                  )}
                  {annual && basePrice && (
                    <p className="font-body text-xs mt-1" style={{ color: isPopular ? 'rgba(191,139,94,0.6)' : 'rgba(166,82,63,0.8)' }}>
                      Billed ₹{Math.round(basePrice * 0.8 * 12).toLocaleString('en-IN')}/yr
                    </p>
                  )}
                </div>

                <p className={`font-body text-sm mb-6 ${isPopular ? 'text-white/50' : 'text-charcoal/50'}`}>{desc}</p>

                <ul className="space-y-3 flex-1 mb-8">
                  {features.map(f => (
                    <li key={f} className={`flex items-center gap-3 font-body text-sm ${isPopular ? 'text-white/70' : 'text-charcoal/65'}`}>
                      <Check size={14} className={isPopular ? 'text-gold flex-shrink-0' : 'text-copper flex-shrink-0'} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="w-full py-3.5 rounded-xl font-body text-sm font-semibold transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5"
                  style={isPopular
                    ? { background: 'linear-gradient(135deg, #BF8B5E, #a67748)', color: '#260B10' }
                    : { background: 'rgba(38,11,16,0.07)', color: '#260B10', border: '1px solid rgba(38,11,16,0.12)' }
                  }
                >
                  {cta}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 8. LIVE DEMO
// ═══════════════════════════════════════════════════════════════════
function DemoMockupCustomer() {
  return (
    <PhoneFrame>
      <div className="px-3 py-3 space-y-3">
        <div className="h-28 rounded-xl" style={{ background: 'linear-gradient(135deg, #260B10, #3d1219)' }}>
          <div className="p-3">
            <div className="h-2.5 rounded w-24 mb-1" style={{ background: 'rgba(191,139,94,0.4)' }} />
            <div className="h-2 rounded w-16" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {['Starters','Mains','Grill','Drinks'].map((c,i) => (
            <div key={c} className="px-2.5 py-1 rounded-full font-body text-[8px] whitespace-nowrap"
              style={{ background: i===0 ? '#BF8B5E' : 'rgba(255,255,255,0.05)', color: i===0 ? '#260B10' : 'rgba(255,255,255,0.4)' }}>
              {c}
            </div>
          ))}
        </div>
        {[1,2].map(i => (
          <div key={i} className="flex gap-2.5 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: 'rgba(191,139,94,0.12)' }} />
            <div className="flex-1">
              <div className="h-2 rounded w-20 mb-1.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="h-1.5 rounded w-12" style={{ background: 'rgba(191,139,94,0.3)' }} />
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center mt-2.5" style={{ background: 'rgba(191,139,94,0.2)' }}>
              <span className="text-gold" style={{ fontSize: 9 }}>+</span>
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

function DemoMockupAdmin() {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          {['₹4.2L','148 Orders','32 Tables','4.9★'].map((v,i) => (
            <div key={i} className="flex-1 p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(191,139,94,0.07)' }}>
              <p className="font-heading text-base text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-end gap-1 h-20">
              {[40,60,45,75,55,85,65,80,70,90].map((h,i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `rgba(191,139,94,${0.15+h/350})` }} />
              ))}
            </div>
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
            {['Pending','Preparing','Ready'].map((s,i) => (
              <div key={s} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: ['#f59e0b','#3b82f6','#22c55e'][i] }} />
                  <span className="font-body text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{s}</span>
                </div>
                <span className="font-body text-[9px] text-white">{[12,8,5][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function DemoMockupKitchen() {
  return (
    <BrowserFrame>
      <div className="p-4 grid grid-cols-3 gap-3">
        {[
          { col: 'Incoming', color: '#f59e0b', tickets: 3 },
          { col: 'Preparing', color: '#3b82f6', tickets: 5 },
          { col: 'Ready', color: '#22c55e', tickets: 2 },
        ].map(({ col, color, tickets }) => (
          <div key={col}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="font-body text-[9px] font-semibold text-white/60">{col}</span>
              <span className="ml-auto font-body text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: color+'20', color }}>{tickets}</span>
            </div>
            {Array.from({ length: Math.min(tickets, 2) }).map((_, i) => (
              <div key={i} className="mb-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${color}25` }}>
                <div className="h-0.5" style={{ background: color }} />
                <div className="p-2 space-y-1">
                  <div className="h-1.5 rounded w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-1.5 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function DemoMockupMobile() {
  return (
    <PhoneFrame>
      <div className="px-3 py-3 space-y-2.5">
        <div className="h-32 rounded-xl" style={{ background: 'linear-gradient(135deg, #260B10 0%, #3d1219 100%)' }}>
          <div className="p-3">
            <div className="h-2.5 rounded w-28 mb-2" style={{ background: 'rgba(191,139,94,0.4)' }} />
            <div className="flex gap-2">
              {['Dine-in','Takeaway','Delivery'].map((t,i) => (
                <div key={t} className="px-2 py-0.5 rounded-full font-body" style={{ fontSize: 7, background: i===0 ? 'rgba(191,139,94,0.25)' : 'rgba(255,255,255,0.06)', color: i===0 ? '#BF8B5E' : 'rgba(255,255,255,0.3)' }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {['Nearby','Top Rated','Trending'].map((t) => (
            <div key={t} className="flex-1 p-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(191,139,94,0.08)' }}>
              <span className="font-body" style={{ fontSize: 8, color: 'rgba(191,139,94,0.6)' }}>{t}</span>
            </div>
          ))}
        </div>
        {[1,2].map(i => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-14" style={{ background: 'rgba(191,139,94,0.08)' }} />
            <div className="p-2 space-y-1">
              <div className="h-2 rounded w-24" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="h-1.5 rounded w-16" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

const DEMO_CONTENTS = {
  customer: DemoMockupCustomer,
  admin:    DemoMockupAdmin,
  kitchen:  DemoMockupKitchen,
  mobile:   DemoMockupMobile,
};

function DemoSection() {
  const [tab, setTab] = useState('admin');

  return (
    <section id="demo" className="section" style={{ background: '#150a0d' }}>
      <div className="container-xl">
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger()}
        >
          <motion.div variants={revealUp}><Eyebrow>Live preview</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-white"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            See Savora <span className="text-gold-gradient">in action</span>
          </motion.h2>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {DEMO_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative px-5 py-2.5 rounded-xl font-body text-sm transition-all duration-200"
              style={{
                background: tab === t.id ? 'rgba(191,139,94,0.15)' : 'rgba(255,255,255,0.04)',
                color:      tab === t.id ? '#BF8B5E' : 'rgba(255,255,255,0.4)',
                border:     `1px solid ${tab === t.id ? 'rgba(191,139,94,0.35)' : 'transparent'}`,
              }}
            >
              {t.label}
              {tab === t.id && (
                <motion.div layoutId="demo-underline" className="absolute inset-x-0 -bottom-px h-px"
                  style={{ background: '#BF8B5E' }} />
              )}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
            className="flex justify-center"
          >
            {tab === 'mobile' || tab === 'customer'
              ? (() => { const M = DEMO_CONTENTS[tab as keyof typeof DEMO_CONTENTS]; return <M />; })()
              : (() => { const M = DEMO_CONTENTS[tab as keyof typeof DEMO_CONTENTS]; return <div className="max-w-3xl w-full"><M /></div>; })()
            }
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 9. CTA
// ═══════════════════════════════════════════════════════════════════
function CTASection() {
  const [email, setEmail] = useState('');

  return (
    <section id="contact" className="py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #260B10 0%, #733122 100%)' }} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #BF8B5E, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative container-xl text-center">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger(0.1)}
        >
          <motion.div variants={revealUp}><Eyebrow>Get started</Eyebrow></motion.div>
          <motion.h2 variants={revealUp} className="font-heading text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
            Ready to transform<br />your restaurant?
          </motion.h2>
          <motion.p variants={revealUp} className="font-body text-base mb-10 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Join 500+ restaurants already running on Savora. Your first 14 days are completely free.
          </motion.p>
          <motion.div variants={revealUp} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@restaurant.com"
              className="flex-1 px-4 py-3.5 rounded-xl font-body text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            />
            <button
              className="px-6 py-3.5 rounded-xl font-body text-sm font-bold transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #BF8B5E, #a67748)', color: '#260B10', boxShadow: '0 8px 24px rgba(191,139,94,0.3)' }}
            >
              Get Started Free
            </button>
          </motion.div>
          <motion.p variants={revealUp} className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No credit card required · 14-day free trial · Cancel any time
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 10. FOOTER
// ═══════════════════════════════════════════════════════════════════
const FOOTER_LINKS = {
  Product:   ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
  Company:   ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Resources: ['Documentation', 'API Reference', 'Status', 'Support', 'Community'],
  Legal:     ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
};

function LandingFooter() {
  return (
    <footer style={{ background: '#0d0508', borderTop: '1px solid rgba(191,139,94,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-1">
            <p className="font-heading text-2xl tracking-[0.2em] text-gold mb-3">SAVORA</p>
            <p className="font-body text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              The complete operating system for modern hospitality.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(191,139,94,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#BF8B5E')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(191,139,94,0.5)')}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([col, links]) => (
            <div key={col}>
              <p className="font-body text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(191,139,94,0.5)' }}>{col}</p>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="font-body text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                    >{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Built with ❤️ for the hospitality industry
          </p>
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} Savora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIDEO MODAL
// ═══════════════════════════════════════════════════════════════════
function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease }}
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
        style={{ background: '#150a0d', border: '1px solid rgba(191,139,94,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 cursor-default"
              style={{ background: 'rgba(191,139,94,0.15)', border: '1px solid rgba(191,139,94,0.3)' }}
            >
              <Play size={32} fill="#BF8B5E" className="text-gold ml-1" />
            </div>
            <p className="font-heading text-3xl text-white mb-2">Product Demo</p>
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Demo video coming soon</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          <X size={18} />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <style>{MARQUEE_CSS}</style>

      <div className="noise-bg">
        <LandingNavbar onDemo={() => setDemoOpen(true)} />

        <HeroSection
          onDemo={() => setDemoOpen(true)}
          onTrial={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
        />
        <ServicesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ClientsSection />
        <PricingSection />
        <DemoSection />
        <CTASection />
        <LandingFooter />
      </div>

      <AnimatePresence>
        {demoOpen && <VideoModal onClose={() => setDemoOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
