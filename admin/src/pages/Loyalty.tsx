import { motion } from 'framer-motion';
import { Star, Gift, TrendingUp, Users, Plus } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

const TIERS = [
  { name: 'Bronze',   minSpend: 0,      maxSpend: 19999,  multiplier: 1,   color: '#92400e', bg: '#fef3c7', members: 142 },
  { name: 'Silver',   minSpend: 20000,  maxSpend: 49999,  multiplier: 1.5, color: '#6b7280', bg: '#f9fafb', members: 86 },
  { name: 'Gold',     minSpend: 50000,  maxSpend: 99999,  multiplier: 2,   color: '#a67748', bg: 'rgba(191,139,94,0.08)', members: 54 },
  { name: 'Platinum', minSpend: 100000, maxSpend: null,   multiplier: 3,   color: '#374151', bg: '#f3f4f6', members: 18 },
];

const RECENT_REDEMPTIONS = [
  { name: 'Kavya Nair',    reward: '₹500 Off',     points: 500,  date: '23 Jun', tier: 'Platinum' },
  { name: 'Ananya Reddy',  reward: 'Free Dessert',  points: 200,  date: '22 Jun', tier: 'Platinum' },
  { name: 'Priya Sharma',  reward: '₹200 Off',     points: 200,  date: '21 Jun', tier: 'Gold' },
  { name: 'Arjun Mehta',   reward: 'Priority Table', points: 300, date: '20 Jun', tier: 'Gold' },
  { name: 'Sneha Patel',   reward: '₹100 Off',     points: 100,  date: '19 Jun', tier: 'Silver' },
];

const REWARDS = [
  { id: 1, name: '₹100 Off',        points: 100, active: true,  redemptions: 234 },
  { id: 2, name: '₹200 Off',        points: 200, active: true,  redemptions: 142 },
  { id: 3, name: '₹500 Off',        points: 500, active: true,  redemptions: 58 },
  { id: 4, name: 'Free Dessert',     points: 200, active: true,  redemptions: 89 },
  { id: 5, name: 'Priority Table',   points: 300, active: true,  redemptions: 41 },
  { id: 6, name: 'Chef\'s Table',    points: 1000, active: false, redemptions: 7 },
];

export function Loyalty() {
  const totalMembers = TIERS.reduce((s, t) => s + t.members, 0);

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Loyalty Program</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">{totalMembers} active members</p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <button className="btn-primary text-xs gap-1.5"><Plus size={13} /> Add Reward</button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Members',     value: String(totalMembers), icon: Users,       color: '#BF8B5E' },
            { label: 'Points Issued',     value: '1.24M',              icon: Star,        color: '#f59e0b' },
            { label: 'Points Redeemed',   value: '820K',               icon: Gift,        color: '#10b981' },
            { label: 'Retention Rate',    value: '84%',                icon: TrendingUp,  color: '#3b82f6' },
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

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Tier breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card">
            <p className="font-body text-sm font-medium text-charcoal/60 mb-4">Tier Breakdown</p>
            <div className="space-y-3">
              {TIERS.map(t => (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-body text-sm text-charcoal/70">{t.name}</span>
                    </div>
                    <span className="font-body text-sm font-medium text-charcoal/60">{t.members}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${(t.members / totalMembers) * 100}%`, backgroundColor: t.color }} />
                    </div>
                    <span className="font-body text-2xs text-charcoal/30 w-8 text-right">
                      {Math.round(t.members / totalMembers * 100)}%
                    </span>
                  </div>
                  <p className="font-body text-2xs text-charcoal/30 mt-1 pl-4">
                    {t.maxSpend
                      ? `₹${(t.minSpend / 1000).toFixed(0)}k–₹${(t.maxSpend / 1000).toFixed(0)}k · ${t.multiplier}× pts`
                      : `₹${(t.minSpend / 1000).toFixed(0)}k+ · ${t.multiplier}× pts`}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rewards list */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-sm font-medium text-charcoal/60">Rewards</p>
            </div>
            <div className="space-y-2">
              {REWARDS.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: r.active ? 'rgba(191,139,94,0.1)' : '#f3f4f6' }}>
                      <Gift size={13} style={{ color: r.active ? '#BF8B5E' : '#9ca3af' }} />
                    </div>
                    <div>
                      <p className="font-body text-xs font-medium text-charcoal/70">{r.name}</p>
                      <p className="font-body text-2xs text-charcoal/35">{r.points} pts · {r.redemptions} redeemed</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${r.active ? 'bg-emerald-400' : 'bg-charcoal/15'}`} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent redemptions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card">
            <p className="font-body text-sm font-medium text-charcoal/60 mb-4">Recent Redemptions</p>
            <div className="space-y-3">
              {RECENT_REDEMPTIONS.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-body text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(191,139,94,0.1)', color: '#a67748' }}>
                    {r.name.split(' ').map(p => p[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-medium text-charcoal/70 truncate">{r.name}</p>
                    <p className="font-body text-2xs text-charcoal/40">{r.reward} · {r.points} pts</p>
                  </div>
                  <span className="font-body text-2xs text-charcoal/30 flex-shrink-0">{r.date}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
