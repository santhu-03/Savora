import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, BarChart3 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

// ─── Data sets ─────────────────────────────────────────────────
const REVENUE_7D = [
  { date: 'Mon', revenue: 42000, orders: 42 }, { date: 'Tue', revenue: 58000, orders: 58 },
  { date: 'Wed', revenue: 49000, orders: 49 }, { date: 'Thu', revenue: 72000, orders: 72 },
  { date: 'Fri', revenue: 91000, orders: 91 }, { date: 'Sat', revenue: 124000, orders: 124 },
  { date: 'Sun', revenue: 86000, orders: 86 },
];

const REVENUE_30D = [
  { date: '1 Jun', revenue: 38000, orders: 38 }, { date: '3 Jun', revenue: 52000, orders: 52 },
  { date: '5 Jun', revenue: 44000, orders: 44 }, { date: '7 Jun', revenue: 68000, orders: 68 },
  { date: '9 Jun', revenue: 91000, orders: 91 }, { date: '11 Jun', revenue: 124000, orders: 124 },
  { date: '13 Jun', revenue: 86000, orders: 86 }, { date: '15 Jun', revenue: 72000, orders: 72 },
  { date: '17 Jun', revenue: 58000, orders: 58 }, { date: '19 Jun', revenue: 93000, orders: 93 },
  { date: '21 Jun', revenue: 115000, orders: 115 }, { date: '23 Jun', revenue: 142000, orders: 142 },
];

const REVENUE_90D = Array.from({ length: 12 }, (_, i) => ({
  date: `W${i + 1}`, revenue: 280000 + Math.sin(i * 0.8) * 80000 + Math.random() * 40000, orders: 280 + Math.round(Math.random() * 80),
}));

const TOP_DISHES = [
  { name: 'Saffron Risotto',    orders: 34, revenue: 42160 },
  { name: 'Pan-Seared Duck',    orders: 28, revenue: 47040 },
  { name: 'Truffle Arancini',   orders: 22, revenue: 17600 },
  { name: 'Chocolate Fondant',  orders: 19, revenue: 12920 },
  { name: 'Elderflower Spritz', orders: 31, revenue: 13020 },
  { name: 'Burrata Caprese',    orders: 18, revenue: 17100 },
  { name: 'Grilled Sea Bass',   orders: 15, revenue: 28800 },
  { name: 'Panna Cotta',        orders: 12, revenue: 6240  },
  { name: 'Truffle Fries',      orders: 25, revenue: 12000 },
  { name: 'Duck Confit',        orders: 11, revenue: 18480 },
];

const RETENTION = [
  { week: 'W1', new: 42, returning: 18 }, { week: 'W2', new: 38, returning: 24 },
  { week: 'W3', new: 51, returning: 31 }, { week: 'W4', new: 44, returning: 38 },
  { week: 'W5', new: 36, returning: 42 }, { week: 'W6', new: 48, returning: 45 },
];

const SENTIMENT = [
  { date: 'Jun 1', score: 4.2 }, { date: 'Jun 5', score: 4.4 },
  { date: 'Jun 10', score: 4.1 }, { date: 'Jun 15', score: 4.6 },
  { date: 'Jun 20', score: 4.5 }, { date: 'Jun 23', score: 4.7 },
];

// 7-day × 24-hour heatmap data (simplified to 7 × 12 business hours)
const HOURS = ['11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm'];
const DAYS_HM = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HEATMAP = DAYS_HM.map((_day, di) =>
  HOURS.map((_, hi) => {
    const base = [12, 15, 14, 18, 22, 35, 20][di];
    const timeMultiplier = [0.3, 0.7, 0.9, 0.5, 0.2, 0.2, 0.4, 0.6, 1.0, 1.1, 0.8, 0.5][hi];
    return Math.round(base * timeMultiplier + Math.random() * 5);
  })
);

const fmt     = (n: number) => `₹${(n / 1000).toFixed(0)}k`;
const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── Chart tooltip ─────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-card-hover border border-black/[0.06]">
      <p className="font-body text-xs text-charcoal/40 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-body text-sm font-semibold"
          style={{ color: p.color ?? '#BF8B5E' }}>
          {typeof p.value === 'number' && p.value > 999 ? fmtFull(p.value) : p.value}
          {p.dataKey === 'score' && ' / 5'}
        </p>
      ))}
    </div>
  );
}

type Range = '7d' | '30d' | '90d';

// ─── Analytics page ─────────────────────────────────────────────
export function Analytics() {
  const [range, setRange]           = useState<Range>('30d');
  const [revenueView, setRevView]   = useState<'day' | 'week' | 'month'>('day');

  const revenueData = range === '7d' ? REVENUE_7D : range === '30d' ? REVENUE_30D : REVENUE_90D;

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = revenueData.reduce((s, d) => s + d.orders, 0);
  const maxHeat      = Math.max(...HEATMAP.flat());

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Analytics</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'} · All outlets
            </p>
          </motion.div>
          {/* Date range picker */}
          <motion.div variants={fadeUp} className="flex items-center gap-1 bg-black/[0.04] rounded-xl p-1">
            {(['7d', '30d', '90d'] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className="font-body text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  backgroundColor: range === r ? '#260B10' : 'transparent',
                  color: range === r ? '#fff' : 'rgba(26,26,26,0.5)',
                }}>{r}</button>
            ))}
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, delta: '+18.4%', positive: true,  icon: DollarSign,  color: '#BF8B5E' },
            { label: 'Total Orders',  value: totalOrders.toLocaleString('en-IN'),        delta: '+12.1%', positive: true,  icon: ShoppingBag, color: '#3b82f6' },
            { label: 'New Guests',    value: '184',    delta: '+6.8%',  positive: true,  icon: Users,     color: '#10b981' },
            { label: 'Avg. Check',    value: '₹1,840', delta: '-2.3%',  positive: false, icon: BarChart3, color: '#f59e0b' },
          ].map(({ label, value, delta, positive, icon: Icon, color }, i) => (
            <motion.div key={label} variants={fadeUp} custom={i * 0.05} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}12` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className={`inline-flex items-center gap-1 font-body text-xs font-medium
                  ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{delta}
                </span>
              </div>
              <p className="font-display text-3xl text-charcoal">{value}</p>
              <p className="font-body text-xs text-charcoal/40 mt-1">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Row 1: Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-label mb-1">Revenue Over Time</p>
              <p className="font-display text-2xl text-charcoal">{fmt(totalRevenue / 1000 * 1000)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/[0.04] rounded-lg p-0.5">
                {(['day', 'week', 'month'] as const).map(v => (
                  <button key={v} onClick={() => setRevView(v)}
                    className="font-body text-xs px-2.5 py-1 rounded-md transition-all capitalize"
                    style={{
                      backgroundColor: revenueView === v ? '#fff' : 'transparent',
                      color: revenueView === v ? '#260B10' : 'rgba(26,26,26,0.4)',
                      boxShadow: revenueView === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>{v}</button>
                ))}
              </div>
              <span className="badge badge-confirmed"><TrendingUp size={10} /> +18.4%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BF8B5E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#BF8B5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent"
                tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
              <YAxis stroke="transparent" tickFormatter={fmt}
                tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(191,139,94,0.2)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="revenue" stroke="#BF8B5E" strokeWidth={2}
                fill="url(#goldGrad)" dot={false}
                activeDot={{ r: 4, fill: '#BF8B5E', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Row 2: Peak hours heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card">
          <p className="section-label mb-1">Peak Hours Heatmap</p>
          <p className="font-display text-xl text-charcoal mb-4">Covers per hour by day of week</p>
          <div className="overflow-x-auto no-scrollbar">
            <div className="min-w-[600px]">
              {/* Hour header */}
              <div className="flex mb-1.5" style={{ paddingLeft: 36 }}>
                {HOURS.map(h => (
                  <div key={h} className="flex-1 font-body text-2xs text-charcoal/35 text-center">{h}</div>
                ))}
              </div>
              {/* Grid */}
              {HEATMAP.map((row, di) => (
                <div key={di} className="flex items-center mb-1">
                  <div className="w-9 font-body text-2xs text-charcoal/40 flex-shrink-0">{DAYS_HM[di]}</div>
                  {row.map((val, hi) => {
                    const intensity = val / maxHeat;
                    return (
                      <div key={hi}
                        className="flex-1 h-8 rounded-md mx-0.5 flex items-center justify-center transition-all hover:scale-110 cursor-default"
                        style={{
                          backgroundColor: `rgba(191,139,94,${0.08 + intensity * 0.82})`,
                        }}
                        title={`${DAYS_HM[di]} ${HOURS[hi]}: ${val} covers`}>
                        {val > maxHeat * 0.7 && (
                          <span className="font-body text-2xs text-white/80">{val}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3">
                <span className="font-body text-2xs text-charcoal/35">Low</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
                  <div key={i} className="w-5 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(191,139,94,${0.08 + i * 0.82})` }} />
                ))}
                <span className="font-body text-2xs text-charcoal/35">High</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 3: Top 10 items side-by-side */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-2 gap-4">

          {/* By orders */}
          <div className="stat-card">
            <p className="section-label mb-1">Top 10 Items</p>
            <p className="font-display text-xl text-charcoal mb-4">By orders count</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...TOP_DISHES].sort((a, b) => b.orders - a.orders)} layout="vertical"
                margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                <XAxis type="number" stroke="transparent"
                  tick={{ fontSize: 10, fill: 'rgba(26,26,26,0.3)', fontFamily: 'Inter' }} />
                <YAxis type="category" dataKey="name" width={120} stroke="transparent"
                  tick={{ fontSize: 10, fill: 'rgba(26,26,26,0.55)', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="orders" radius={[0, 4, 4, 0]} background={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }}>
                  {TOP_DISHES.sort((a, b) => b.orders - a.orders).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#BF8B5E' : `rgba(191,139,94,${0.8 - i * 0.07})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By revenue */}
          <div className="stat-card">
            <p className="section-label mb-1">Top 10 Items</p>
            <p className="font-display text-xl text-charcoal mb-4">By revenue</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...TOP_DISHES].sort((a, b) => b.revenue - a.revenue)} layout="vertical"
                margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                <XAxis type="number" stroke="transparent" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: 'rgba(26,26,26,0.3)', fontFamily: 'Inter' }} />
                <YAxis type="category" dataKey="name" width={120} stroke="transparent"
                  tick={{ fontSize: 10, fill: 'rgba(26,26,26,0.55)', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} background={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }}>
                  {TOP_DISHES.sort((a, b) => b.revenue - a.revenue).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#a67748' : `rgba(166,119,72,${0.8 - i * 0.07})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Row 4: Customer retention + Reviews sentiment */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-2 gap-4">

          {/* New vs Returning */}
          <div className="stat-card">
            <p className="section-label mb-1">Customer Retention</p>
            <p className="font-display text-xl text-charcoal mb-4">New vs returning guests</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={RETENTION} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="week" stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <YAxis stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="new"       fill="rgba(191,139,94,0.35)" radius={[4, 4, 0, 0]} name="New" />
                <Bar dataKey="returning" fill="#BF8B5E"               radius={[4, 4, 0, 0]} name="Returning" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'rgba(191,139,94,0.35)' }} />
                <span className="font-body text-xs text-charcoal/40">New</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm bg-gold" />
                <span className="font-body text-xs text-charcoal/40">Returning</span>
              </div>
            </div>
          </div>

          {/* Reviews sentiment */}
          <div className="stat-card">
            <p className="section-label mb-1">Reviews Sentiment</p>
            <p className="font-display text-xl text-charcoal mb-4">Average rating trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={SENTIMENT} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <YAxis stroke="transparent" domain={[3.5, 5]} ticks={[3.5, 4, 4.5, 5]}
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(191,139,94,0.2)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="font-body text-xs text-charcoal/40">Current: 4.7 / 5.0</span>
              <span className="badge badge-confirmed"><TrendingUp size={10} /> +0.2 this month</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
