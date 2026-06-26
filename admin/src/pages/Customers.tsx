import { motion } from 'framer-motion';
import { UserCheck, ShoppingBag, Star, TrendingUp, Search, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

const CUSTOMERS = [
  { id: 1, name: 'Priya Sharma',   email: 'priya.s@email.com',  visits: 24, spent: 68400, tier: 'Gold',     lastVisit: '2 days ago',  rating: 4.9 },
  { id: 2, name: 'Arjun Mehta',    email: 'arjun.m@email.com',  visits: 18, spent: 52000, tier: 'Gold',     lastVisit: '1 week ago',  rating: 4.7 },
  { id: 3, name: 'Kavya Nair',     email: 'kavya.n@email.com',  visits: 31, spent: 98700, tier: 'Platinum', lastVisit: 'Today',       rating: 5.0 },
  { id: 4, name: 'Rahul Singh',    email: 'rahul.s@email.com',  visits: 8,  spent: 21200, tier: 'Silver',   lastVisit: '2 weeks ago', rating: 4.3 },
  { id: 5, name: 'Sneha Patel',    email: 'sneha.p@email.com',  visits: 12, spent: 34800, tier: 'Silver',   lastVisit: '5 days ago',  rating: 4.6 },
  { id: 6, name: 'Vikram Bose',    email: 'vikram.b@email.com', visits: 3,  spent: 7400,  tier: 'Bronze',   lastVisit: '1 month ago', rating: 4.1 },
  { id: 7, name: 'Ananya Reddy',   email: 'ananya.r@email.com', visits: 47, spent: 148000, tier: 'Platinum', lastVisit: 'Today',      rating: 4.9 },
  { id: 8, name: 'Siddharth Kumar',email: 'sidd.k@email.com',   visits: 6,  spent: 16200, tier: 'Bronze',   lastVisit: '3 weeks ago', rating: 4.2 },
];

const TIER_CFG: Record<string, { bg: string; text: string; border: string }> = {
  Platinum: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' },
  Gold:     { bg: 'rgba(191,139,94,0.1)', text: '#a67748', border: 'rgba(191,139,94,0.3)' },
  Silver:   { bg: '#f9fafb', text: '#6b7280', border: '#d1d5db' },
  Bronze:   { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
};

export function Customers() {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('All');

  const filtered = CUSTOMERS.filter(c => {
    const matchTier = tier === 'All' || c.tier === tier;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchTier && matchSearch;
  });

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Customers</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">{CUSTOMERS.length} registered guests</p>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Guests',  value: String(CUSTOMERS.length), icon: UserCheck, color: '#BF8B5E' },
            { label: 'Avg. Visits',   value: (CUSTOMERS.reduce((s, c) => s + c.visits, 0) / CUSTOMERS.length).toFixed(1), icon: ShoppingBag, color: '#3b82f6' },
            { label: 'Total Revenue', value: `₹${(CUSTOMERS.reduce((s, c) => s + c.spent, 0) / 1000).toFixed(0)}k`, icon: TrendingUp, color: '#10b981' },
            { label: 'Avg. Rating',   value: (CUSTOMERS.reduce((s, c) => s + c.rating, 0) / CUSTOMERS.length).toFixed(1), icon: Star, color: '#f59e0b' },
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

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card !p-0 overflow-hidden">

          <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.05] flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search guests…" className="input w-full pl-8 py-2 text-xs" />
            </div>
            <div className="flex items-center gap-1">
              {['All', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(t => (
                <button key={t} onClick={() => setTier(t)}
                  className="font-body text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                  style={{
                    backgroundColor: tier === t ? '#260B10' : 'transparent',
                    color: tier === t ? '#fff' : 'rgba(26,26,26,0.4)',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th>Guest</th><th>Tier</th><th>Visits</th>
                  <th>Total Spent</th><th>Last Visit</th><th>Rating</th><th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const cfg = TIER_CFG[c.tier];
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-body text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: `${cfg.text}15`, color: cfg.text }}>
                            {c.name.split(' ').map(p => p[0]).join('')}
                          </div>
                          <div>
                            <p className="font-body text-sm text-charcoal/80 font-medium">{c.name}</p>
                            <p className="font-body text-xs text-charcoal/35">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-body text-xs px-2 py-1 rounded-lg"
                          style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                          {c.tier}
                        </span>
                      </td>
                      <td><span className="font-body text-sm text-charcoal/60">{c.visits}</span></td>
                      <td><span className="font-body text-sm font-medium text-charcoal/70">₹{c.spent.toLocaleString('en-IN')}</span></td>
                      <td><span className="font-body text-xs text-charcoal/40">{c.lastVisit}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Star size={12} style={{ color: '#f59e0b' }} />
                          <span className="font-body text-sm text-charcoal/60">{c.rating}</span>
                        </div>
                      </td>
                      <td><button className="btn-icon w-7 h-7"><MoreHorizontal size={14} /></button></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
