import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Star, Clock, Users, ChevronRight, MapPin } from 'lucide-react';

// ─── Motion Variants ─────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Navbar ──────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-glass' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-display text-2xl text-gradient leading-none">
          Savora
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {['Menu', 'Reservations', 'About', 'Contact'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="px-4 py-2 font-body text-sm text-off-white/50 hover:text-off-white transition-colors duration-150 rounded-lg hover:bg-white/[0.04]"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="#reservations" className="btn-ghost text-xs py-2 px-4">
            Sign In
          </a>
          <a href="#reservations" className="btn-primary text-xs py-2 px-4">
            Reserve a Table
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden btn-icon text-off-white/60"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/[0.06] px-6 py-4 space-y-1"
          >
            {['Menu', 'Reservations', 'About', 'Contact'].map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="block px-3 py-2.5 font-body text-sm text-off-white/60 hover:text-gold rounded-lg"
                onClick={() => setOpen(false)}
              >
                {link}
              </a>
            ))}
            <div className="pt-2">
              <a href="#reservations" className="btn-primary w-full text-center block">
                Reserve a Table
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ─── Hero ────────────────────────────────────────────────────
const stats = [
  { value: '2,400+', label: 'Happy Guests' },
  { value: '120', label: 'Signature Dishes' },
  { value: '4.9', label: 'Average Rating' },
  { value: '8 yrs', label: 'Of Excellence' },
];

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">
      {/* Ambient blobs */}
      <div
        className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #C89B3C, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7A5C2E, transparent 70%)' }}
      />

      {/* Content */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center max-w-4xl"
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-10 bg-gold/40" />
          <span className="font-body text-gold/60 text-xs uppercase tracking-[0.3em]">
            Fine Dining · Est. 2024
          </span>
          <span className="h-px w-10 bg-gold/40" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          custom={0.1}
          className="font-display font-normal text-[clamp(3.5rem,10vw,7rem)] leading-[0.95] text-off-white mb-4"
        >
          Savor Every
        </motion.h1>
        <motion.h1
          variants={fadeUp}
          custom={0.2}
          className="font-display italic font-semibold text-[clamp(3.5rem,10vw,7rem)] leading-[0.95] text-gradient mb-8"
        >
          Moment
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          custom={0.3}
          className="font-body text-off-white/45 text-lg max-w-lg mx-auto leading-relaxed mb-10"
        >
          Reserve your table, explore a curated menu crafted by award-winning chefs,
          and indulge in flavors designed to create lasting memories.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          custom={0.4}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a href="#reservations" className="btn-primary px-8 py-3.5 text-sm">
            Reserve a Table
          </a>
          <a href="#menu" className="btn-ghost px-8 py-3.5 text-sm flex items-center gap-2">
            Explore Menu <ChevronRight size={16} />
          </a>
        </motion.div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-3xl mt-20"
      >
        <div className="glass rounded-2xl px-8 py-6 grid grid-cols-4 gap-6 divide-x divide-white/[0.06]">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center px-4 first:pl-0 last:pr-0">
              <div className="font-display text-2xl text-gradient mb-1">{value}</div>
              <div className="font-body text-off-white/35 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-body text-2xs text-off-white/25 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-gold/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────
const features = [
  {
    icon: '✦',
    title: 'The Menu',
    description:
      '120 signature dishes curated by our executive chefs, from classic French technique to contemporary Indian fusion.',
  },
  {
    icon: '◈',
    title: 'The Setting',
    description:
      'An intimate dining room of 18 tables, dressed in warm candlelight and soft acoustics designed for conversation.',
  },
  {
    icon: '◉',
    title: 'The Experience',
    description:
      'Personalised service from arrival to dessert. Every detail, from the amuse-bouche to the farewell, is considered.',
  },
];

function Features() {
  return (
    <section id="about" className="section">
      <div className="container-lg">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="section-label justify-center">
            <span className="h-px w-6 bg-gold/40" />
            What We Offer
            <span className="h-px w-6 bg-gold/40" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-display text-5xl text-off-white mb-4"
          >
            A dining destination
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-display italic text-gold/70 text-xl"
          >
            crafted for those who appreciate the finer things
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-5"
        >
          {features.map(({ icon, title, description }) => (
            <motion.div key={title} variants={fadeUp}>
              <div className="group card p-8 h-full">
                <div className="text-2xl text-gold mb-6">{icon}</div>
                <h3 className="font-display text-2xl text-off-white mb-3">{title}</h3>
                <p className="font-body text-off-white/45 text-sm leading-relaxed">{description}</p>
                <div className="mt-6 text-gold/0 group-hover:text-gold/60 transition-all duration-300">
                  <span className="font-body text-xs flex items-center gap-1">
                    Learn more <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Menu Preview ─────────────────────────────────────────────
const dishes = [
  {
    name: 'Saffron Risotto',
    description: 'Arborio rice, aged parmesan, truffle oil, wild mushrooms, microgreens',
    price: '₹1,240',
    category: "Chef's Special",
    bg: 'from-amber-900/50 to-stone-900/80',
    dot: 'bg-amber-500',
  },
  {
    name: 'Pan-Seared Duck',
    description: 'Confit duck leg, cherry jus, roasted root vegetables, orange zest',
    price: '₹1,680',
    category: 'Main Course',
    bg: 'from-rose-900/50 to-stone-900/80',
    dot: 'bg-rose-500',
  },
  {
    name: 'Dark Chocolate Fondant',
    description: 'Belgian 72% cocoa, salted caramel, vanilla bean ice cream, gold leaf',
    price: '₹680',
    category: 'Dessert',
    bg: 'from-stone-800/70 to-amber-950/60',
    dot: 'bg-amber-600',
  },
];

function MenuPreview() {
  return (
    <section id="menu" className="section">
      <div className="container-lg">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="section-label">
            <span className="h-px w-6 bg-gold/40" />
            Curated Selection
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          >
            <h2 className="font-display text-5xl text-off-white">
              Tonight's<br />
              <span className="italic text-gradient">Highlights</span>
            </h2>
            <a
              href="#"
              className="font-body text-sm text-gold/60 hover:text-gold flex items-center gap-1.5 transition-colors"
            >
              View full menu <ChevronRight size={14} />
            </a>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid md:grid-cols-3 gap-5"
          >
            {dishes.map(({ name, description, price, category, bg, dot }) => (
              <motion.div key={name} variants={fadeUp}>
                <motion.div
                  className="card overflow-hidden group cursor-pointer"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {/* Dish image placeholder */}
                  <div className={`aspect-[4/3] bg-gradient-to-br ${bg} relative overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-10 select-none">◈</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="glass text-off-white/70 font-body text-xs px-2.5 py-1 rounded-full">
                        {category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display text-xl text-off-white group-hover:text-gold transition-colors duration-200">
                        {name}
                      </h3>
                      <span className="font-body font-semibold text-gold text-sm whitespace-nowrap">
                        {price}
                      </span>
                    </div>
                    <p className="font-body text-off-white/40 text-xs leading-relaxed">
                      {description}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span className="font-body text-off-white/30 text-xs flex items-center gap-1">
                        <Clock size={10} /> 20–25 min
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Reservation CTA ─────────────────────────────────────────
function ReservationCTA() {
  return (
    <section id="reservations" className="section">
      <div className="container-lg">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <div className="glass-gold rounded-3xl p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left */}
              <motion.div variants={fadeUp}>
                <div className="section-label mb-6">
                  <span className="h-px w-6 bg-gold/40" />
                  Reservations
                </div>
                <h2 className="font-display text-4xl md:text-5xl text-off-white mb-4 leading-tight">
                  Reserve your<br />
                  <span className="italic text-gradient">evening</span>
                </h2>
                <p className="font-body text-off-white/45 text-sm leading-relaxed mb-6">
                  We accommodate groups of 1 to 12 guests. For larger events or private
                  dining, please contact us directly.
                </p>
                <div className="flex flex-col gap-2.5 text-off-white/40 font-body text-sm">
                  <div className="flex items-center gap-2.5">
                    <Clock size={14} className="text-gold/60" />
                    Lunch: 12:00 – 15:00 · Dinner: 19:00 – 23:00
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={14} className="text-gold/60" />
                    12 Regal Lane, Indiranagar, Bengaluru
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Star size={14} className="text-gold/60" />
                    Michelin-recommended · 4.9 on Google
                  </div>
                </div>
              </motion.div>

              {/* Right — form */}
              <motion.div variants={fadeUp} custom={0.15}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-xs text-off-white/40 uppercase tracking-wider block mb-1.5">
                        Date
                      </label>
                      <input type="date" className="input" />
                    </div>
                    <div>
                      <label className="font-body text-xs text-off-white/40 uppercase tracking-wider block mb-1.5">
                        Time
                      </label>
                      <select className="input appearance-none cursor-pointer">
                        {['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map(t => (
                          <option key={t} value={t} className="bg-surface">{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-xs text-off-white/40 uppercase tracking-wider block mb-1.5">
                        Guests
                      </label>
                      <select className="input appearance-none cursor-pointer">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                          <option key={n} value={n} className="bg-surface">{n} {n === 1 ? 'guest' : 'guests'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-body text-xs text-off-white/40 uppercase tracking-wider block mb-1.5">
                        Occasion
                      </label>
                      <select className="input appearance-none cursor-pointer">
                        {['None', 'Birthday', 'Anniversary', 'Business', 'Proposal'].map(o => (
                          <option key={o} value={o.toLowerCase()} className="bg-surface">{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-off-white/40 uppercase tracking-wider block mb-1.5">
                      Your name
                    </label>
                    <input type="text" placeholder="Full name" className="input" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-off-white/40 uppercase tracking-wider block mb-1.5">
                      Phone
                    </label>
                    <input type="tel" placeholder="+91 98765 43210" className="input" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full py-3.5 mt-2"
                  >
                    Confirm Reservation
                  </motion.button>
                  <p className="text-center font-body text-off-white/25 text-xs">
                    You will receive a confirmation within 30 minutes
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="font-display text-3xl text-gradient mb-3">Savora</div>
            <p className="font-body text-off-white/35 text-sm leading-relaxed max-w-xs">
              An experience beyond the plate. Fine dining, crafted with intention.
            </p>
          </div>
          <div>
            <p className="font-body text-off-white/25 text-xs uppercase tracking-widest mb-4">
              Navigate
            </p>
            {['Menu', 'Reservations', 'About', 'Gift Cards', 'Events'].map(l => (
              <a
                key={l}
                href="#"
                className="block font-body text-sm text-off-white/40 hover:text-gold mb-2 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
          <div>
            <p className="font-body text-off-white/25 text-xs uppercase tracking-widest mb-4">
              Contact
            </p>
            <div className="space-y-2 font-body text-sm text-off-white/40">
              <p>12 Regal Lane</p>
              <p>Indiranagar, Bengaluru 560038</p>
              <p className="pt-1">+91 80 4567 8901</p>
              <p>hello@savora.in</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
          <p className="font-body text-off-white/20 text-xs">
            © {new Date().getFullYear()} Savora Restaurant. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy', 'Terms', 'Accessibility'].map(l => (
              <a key={l} href="#" className="font-body text-xs text-off-white/25 hover:text-off-white/50 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Not Found ───────────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="font-body text-off-white/20 text-sm mb-3 uppercase tracking-widest">404</p>
      <h1 className="font-display text-5xl text-gradient mb-4">Page not found</h1>
      <a href="/" className="btn-ghost text-sm">← Back to Savora</a>
    </div>
  );
}

// ─── Landing Page ────────────────────────────────────────────
function LandingPage() {
  return (
    <div className="noise-bg">
      <Navbar />
      <Hero />
      <Features />
      <MenuPreview />
      <ReservationCTA />
      <Footer />
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
