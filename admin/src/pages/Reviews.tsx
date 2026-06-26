import { motion } from 'framer-motion';
import { MessageSquare, Star, ThumbsUp, Search, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

const REVIEWS = [
  { id: 1, name: 'Kavya Nair',    rating: 5, date: '23 Jun', platform: 'Google', text: 'Absolutely exceptional dining experience. The Saffron Risotto was divine.', responded: true },
  { id: 2, name: 'Arjun Mehta',   rating: 4, date: '22 Jun', platform: 'Google', text: 'Great ambience and food. Service could be slightly faster.', responded: false },
  { id: 3, name: 'Priya Sharma',  rating: 5, date: '21 Jun', platform: 'Zomato', text: 'Best anniversary dinner ever! The staff went above and beyond.', responded: true },
  { id: 4, name: 'Rohit Kumar',   rating: 3, date: '20 Jun', platform: 'Google', text: 'Food was good but the wait time was too long.', responded: false },
  { id: 5, name: 'Ananya Reddy',  rating: 5, date: '19 Jun', platform: 'Zomato', text: 'Every dish was a masterpiece. The truffle arancini is a must.', responded: true },
  { id: 6, name: 'Sneha Patel',   rating: 4, date: '18 Jun', platform: 'Google', text: 'Beautifully presented food. A little pricey but worth it.', responded: false },
];

const RATING_DIST = [
  { stars: 5, count: 124, pct: 62 },
  { stars: 4, count: 52,  pct: 26 },
  { stars: 3, count: 16,  pct: 8 },
  { stars: 2, count: 6,   pct: 3 },
  { stars: 1, count: 2,   pct: 1 },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11}
          style={{ color: i <= rating ? '#f59e0b' : '#e5e7eb', fill: i <= rating ? '#f59e0b' : 'transparent' }} />
      ))}
    </div>
  );
}

export function Reviews() {
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState(0);

  const filtered = REVIEWS.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase());
    const matchRating = filterRating === 0 || r.rating === filterRating;
    return matchSearch && matchRating;
  });

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  const unresponded = REVIEWS.filter(r => !r.responded).length;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Reviews</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">{REVIEWS.length} reviews · {unresponded} need response</p>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Rating summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card">
            <div className="flex items-center gap-4 mb-5">
              <div>
                <p className="font-display text-5xl text-charcoal">{avgRating}</p>
                <StarRow rating={Math.round(Number(avgRating))} />
                <p className="font-body text-xs text-charcoal/40 mt-1">{REVIEWS.length} reviews</p>
              </div>
            </div>
            <div className="space-y-2">
              {RATING_DIST.map(d => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="font-body text-xs text-charcoal/40 w-3">{d.stars}</span>
                  <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                  <div className="flex-1 h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: '#f59e0b' }} />
                  </div>
                  <span className="font-body text-xs text-charcoal/30 w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* KPIs */}
          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="lg:col-span-2 grid grid-cols-3 gap-3 content-start">
            {[
              { label: 'Avg Rating',    value: avgRating,    icon: Star,        color: '#f59e0b' },
              { label: 'Total Reviews', value: String(REVIEWS.length), icon: MessageSquare, color: '#BF8B5E' },
              { label: 'Need Response', value: String(unresponded), icon: ThumbsUp, color: '#ef4444' },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <motion.div key={label} variants={fadeUp} custom={i * 0.05} className="stat-card">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${color}15` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <p className="font-display text-2xl text-charcoal">{value}</p>
                <p className="font-body text-xs text-charcoal/40 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Reviews list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card !p-0 overflow-hidden">

          <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.05] flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search reviews…" className="input w-full pl-8 py-2 text-xs" />
            </div>
            <div className="flex items-center gap-1">
              {[0, 5, 4, 3].map(r => (
                <button key={r} onClick={() => setFilterRating(r)}
                  className="font-body text-xs px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1"
                  style={{
                    backgroundColor: filterRating === r ? '#260B10' : 'transparent',
                    color: filterRating === r ? '#fff' : 'rgba(26,26,26,0.4)',
                  }}>
                  {r === 0 ? 'All' : <>{r} <Star size={10} style={{ fill: filterRating === r ? '#fff' : 'currentColor' }} /></>}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-black/[0.04]">
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-5 py-4 hover:bg-black/[0.01] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-body text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: 'rgba(191,139,94,0.1)', color: '#a67748' }}>
                      {r.name.split(' ').map(p => p[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-sm font-medium text-charcoal/80">{r.name}</span>
                        <StarRow rating={r.rating} />
                        <span className="font-body text-2xs text-charcoal/30">{r.platform}</span>
                        <span className="font-body text-2xs text-charcoal/25 ml-auto">{r.date}</span>
                      </div>
                      <p className="font-body text-sm text-charcoal/60 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.responded
                      ? <span className="font-body text-2xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Replied</span>
                      : <button className="font-body text-2xs text-white px-2.5 py-1 rounded-lg transition-colors"
                          style={{ backgroundColor: '#260B10' }}>Reply</button>
                    }
                    <button className="btn-icon w-7 h-7"><MoreHorizontal size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
