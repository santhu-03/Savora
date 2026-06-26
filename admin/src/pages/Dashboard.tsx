import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight,
  Users, ShoppingBag, CalendarCheck, Clock,
  ChevronRight, MoreHorizontal,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
const revenueData = [
  { day: 'Mon', revenue: 42000, orders: 42 },
  { day: 'Tue', revenue: 58000, orders: 58 },
  { day: 'Wed', revenue: 49000, orders: 49 },
  { day: 'Thu', revenue: 72000, orders: 72 },
  { day: 'Fri', revenue: 91000, orders: 91 },
  { day: 'Sat', revenue: 124000, orders: 124 },
  { day: 'Sun', revenue: 86000, orders: 86 },
];

const orderTypes = [
  { name: 'Dine In',  value: 65, color: '#BF8B5E' },
  { name: 'Takeaway', value: 22, color: '#D9B89C' },
  { name: 'Delivery', value: 13, color: '#a67748' },
];

const liveOrders = [
  { id: 'SVR-0084', table: 'T-12', items: 4, status: 'preparing', time: '8 min', amount: 1840 },
  { id: 'SVR-0083', table: 'T-05', items: 2, status: 'ready',     time: '—',    amount: 960 },
  { id: 'SVR-0082', table: 'T-09', items: 6, status: 'served',    time: '—',    amount: 3200 },
  { id: 'SVR-0081', table: 'T-03', items: 3, status: 'preparing', time: '14 min',amount: 1420 },
  { id: 'SVR-0080', table: 'T-07', items: 5, status: 'pending',   time: '—',    amount: 2100 },
];

const popularDishes = [
  { name: 'Saffron Risotto',    orders: 34, revenue: 42160, trend: 12 },
  { name: 'Pan-Seared Duck',    orders: 28, revenue: 47040, trend: -3 },
  { name: 'Truffle Arancini',   orders: 22, revenue: 17600, trend: 18 },
  { name: 'Chocolate Fondant',  orders: 19, revenue: 12920, trend: 5 },
];

const upcomingReservations = [
  { name: 'Priya Sharma', guests: 4, time: '19:30', table: 'T-08', status: 'confirmed', occasion: 'Birthday' },
  { name: 'Arjun Mehta',  guests: 2, time: '20:00', table: 'T-02', status: 'confirmed', occasion: null },
  { name: 'Kavya Nair',   guests: 6, time: '20:30', table: 'T-14', status: 'confirmed', occasion: 'Anniversary' },
  { name: 'Rahul Singh',  guests: 3, time: '21:00', table: 'T-06', status: 'confirmed', occasion: null },
];

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtK = (n: number) => (n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── KPI Card ─────────────────────────────────────────────────
interface KpiProps {
  label: string; value: string; delta: string; positive: boolean;
  icon: React.ElementType; sub?: string;
}

function KpiCard({ label, value, delta, positive, icon: Icon, sub }: KpiProps) {
  return (
    <motion.div variants={fadeUp} className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(191,139,94,0.1)' }}>
          <Icon size={16} style={{ color: '#BF8B5E' }} />
        </div>
        <span className={`inline-flex items-center gap-1 font-body text-xs font-medium
          ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </span>
      </div>
      <div className="font-display text-3xl text-charcoal leading-none mb-1">{value}</div>
      <div className="font-body text-xs text-charcoal/40 mt-1">{label}</div>
      {sub && <div className="font-body text-xs text-charcoal/25 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-card-hover border border-black/[0.06]">
      <p className="font-body text-xs text-charcoal/40 mb-1">{label}</p>
      <p className="font-body text-sm font-semibold" style={{ color: '#BF8B5E' }}>{fmt(payload[0]?.value)}</p>
      {payload[1] && (
        <p className="font-body text-xs text-charcoal/40">{payload[1]?.value} orders</p>
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────
export function Dashboard() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">
              {greeting}, <span style={{ color: '#BF8B5E' }}>Chef</span>
            </h1>
            <p className="font-body text-xs text-charcoal/35 mt-0.5">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              Saturday is your busiest day — heads up.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-xl px-3 py-2">
              <div className="live-dot" />
              <span className="font-body text-xs text-charcoal/50">Live dashboard</span>
            </div>
            <button className="btn-primary text-xs py-2">+ New Order</button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Today's Revenue" value="₹52,400" delta="+12.4%" positive icon={TrendingUp} sub="vs ₹46,600 yesterday" />
          <KpiCard label="Total Orders"    value="234"     delta="+8.2%"  positive icon={ShoppingBag} sub="18 in last hour" />
          <KpiCard label="Reservations"    value="18"      delta="6 pending" positive icon={CalendarCheck} sub="Next at 7:30 PM" />
          <KpiCard label="Table Occupancy" value="78%"     delta="+5%"    positive icon={Users} sub="14 of 18 tables" />
        </motion.div>

        {/* Charts row */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid lg:grid-cols-3 gap-4">

          {/* Revenue area chart */}
          <motion.div variants={fadeUp} className="lg:col-span-2 stat-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="section-label mb-1">Revenue This Week</p>
                <p className="font-display text-2xl text-charcoal">₹5,22,000</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-confirmed">
                  <TrendingUp size={10} /> +18.4%
                </span>
                <button className="btn-icon"><MoreHorizontal size={15} /></button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BF8B5E" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#BF8B5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="day" stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <YAxis stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }}
                  tickFormatter={fmtK} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(191,139,94,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" stroke="#BF8B5E" strokeWidth={2}
                  fill="url(#goldGradient)" dot={false}
                  activeDot={{ r: 4, fill: '#BF8B5E', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Order types donut */}
          <motion.div variants={fadeUp} className="stat-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">Order Types</p>
              <button className="btn-icon"><MoreHorizontal size={15} /></button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={orderTypes} cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72} paddingAngle={3}
                    dataKey="value" stroke="none">
                    {orderTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 12,
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: '#1a1a1a',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 mt-2">
              {orderTypes.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="font-body text-xs text-charcoal/50">{name}</span>
                  </div>
                  <span className="font-body text-xs font-medium text-charcoal/60">{value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Live orders + Popular dishes */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid lg:grid-cols-3 gap-4">

          {/* Live orders */}
          <motion.div variants={fadeUp} className="lg:col-span-2 stat-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <p className="font-body text-sm font-medium text-charcoal/60">Live Orders</p>
                <div className="live-dot" />
              </div>
              <a href="/orders" className="font-body text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'rgba(191,139,94,0.7)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#BF8B5E')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(191,139,94,0.7)')}>
                View all <ChevronRight size={12} />
              </a>
            </div>
            <div className="table-container">
              <table className="premium">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Table</th><th>Items</th>
                    <th>Status</th><th>ETA</th><th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {liveOrders.map((order, i) => (
                    <motion.tr key={order.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}>
                      <td><span className="font-mono text-xs text-charcoal/50">{order.id}</span></td>
                      <td>
                        <span className="font-body text-xs bg-black/[0.05] text-charcoal/60 px-2 py-1 rounded-lg">
                          {order.table}
                        </span>
                      </td>
                      <td><span className="font-body text-xs text-charcoal/50">{order.items} items</span></td>
                      <td><span className={`badge badge-${order.status}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                      <td>
                        <div className="flex items-center gap-1.5 text-charcoal/40 font-body text-xs">
                          {order.time !== '—' && <Clock size={11} />}
                          {order.time}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="font-body text-sm text-charcoal/70 font-medium">
                          ₹{order.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Popular dishes */}
          <motion.div variants={fadeUp} className="stat-card">
            <div className="flex items-center justify-between mb-5">
              <p className="font-body text-sm font-medium text-charcoal/60">Top Dishes</p>
              <span className="font-body text-xs text-charcoal/25">Today</span>
            </div>
            <div className="space-y-3">
              {popularDishes.map(({ name, orders, revenue, trend }, i) => (
                <div key={name} className="group">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-body text-xs text-charcoal/20 w-4">{i + 1}</span>
                      <span className="font-body text-sm text-charcoal/70 group-hover:text-charcoal transition-colors">
                        {name}
                      </span>
                    </div>
                    <span className={`font-body text-xs flex items-center gap-0.5 flex-shrink-0
                      ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(trend)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-6 mb-1.5">
                    <span className="font-body text-xs text-charcoal/30">{orders} orders</span>
                    <span className="font-body text-xs" style={{ color: '#a67748' }}>
                      ₹{revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pl-6">
                    <div className="h-0.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(orders / 34) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, rgba(191,139,94,0.5), #BF8B5E)' }}
                      />
                    </div>
                  </div>
                  {i < popularDishes.length - 1 && (
                    <div className="border-b border-black/[0.04] mt-3" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Upcoming reservations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card">
          <div className="flex items-center justify-between mb-5">
            <p className="font-body text-sm font-medium text-charcoal/60">Upcoming Reservations</p>
            <a href="/reservations"
              className="font-body text-xs flex items-center gap-1 transition-colors"
              style={{ color: 'rgba(191,139,94,0.7)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#BF8B5E')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(191,139,94,0.7)')}>
              Manage <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th>Guest</th><th>Time</th><th>Table</th>
                  <th>Guests</th><th>Occasion</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.map((res, i) => (
                  <motion.tr key={res.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * i }}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-black/[0.05] border border-black/[0.06] flex items-center justify-center flex-shrink-0">
                          <span className="font-body text-xs text-charcoal/40">{res.name.charAt(0)}</span>
                        </div>
                        <span className="font-body text-sm text-charcoal/70">{res.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-body text-sm text-charcoal/60">
                        <Clock size={12} style={{ color: '#BF8B5E' }} />{res.time} PM
                      </div>
                    </td>
                    <td><span className="font-body text-xs bg-black/[0.05] text-charcoal/60 px-2 py-1 rounded-lg">{res.table}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5 font-body text-xs text-charcoal/50">
                        <Users size={12} />{res.guests}
                      </div>
                    </td>
                    <td>
                      {res.occasion
                        ? <span className="font-body text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(191,139,94,0.1)', color: '#a67748' }}>
                            {res.occasion}
                          </span>
                        : <span className="text-charcoal/20">—</span>}
                    </td>
                    <td><span className="badge badge-confirmed">Confirmed</span></td>
                    <td><button className="btn-icon w-7 h-7"><MoreHorizontal size={14} /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
