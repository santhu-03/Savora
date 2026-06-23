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
  { name: 'Dine In', value: 65, color: '#C89B3C' },
  { name: 'Takeaway', value: 22, color: '#7A5C2E' },
  { name: 'Delivery', value: 13, color: '#D4AE5A' },
];

const liveOrders = [
  { id: 'SVR-0084', table: 'T-12', items: 4, status: 'preparing', time: '8 min', amount: 1840 },
  { id: 'SVR-0083', table: 'T-05', items: 2, status: 'ready', time: '—', amount: 960 },
  { id: 'SVR-0082', table: 'T-09', items: 6, status: 'served', time: '—', amount: 3200 },
  { id: 'SVR-0081', table: 'T-03', items: 3, status: 'preparing', time: '14 min', amount: 1420 },
  { id: 'SVR-0080', table: 'T-07', items: 5, status: 'pending', time: '—', amount: 2100 },
];

const popularDishes = [
  { name: 'Saffron Risotto', orders: 34, revenue: 42160, trend: 12 },
  { name: 'Pan-Seared Duck', orders: 28, revenue: 47040, trend: -3 },
  { name: 'Truffle Arancini', orders: 22, revenue: 17600, trend: 18 },
  { name: 'Chocolate Fondant', orders: 19, revenue: 12920, trend: 5 },
];

const upcomingReservations = [
  { name: 'Priya Sharma', guests: 4, time: '19:30', table: 'T-08', status: 'confirmed', occasion: 'Birthday' },
  { name: 'Arjun Mehta', guests: 2, time: '20:00', table: 'T-02', status: 'confirmed', occasion: null },
  { name: 'Kavya Nair', guests: 6, time: '20:30', table: 'T-14', status: 'confirmed', occasion: 'Anniversary' },
  { name: 'Rahul Singh', guests: 3, time: '21:00', table: 'T-06', status: 'confirmed', occasion: null },
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

// ─── KPI Cards ───────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ElementType;
  sub?: string;
}

function KpiCard({ label, value, delta, positive, icon: Icon, sub }: KpiProps) {
  return (
    <motion.div variants={fadeUp} className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold/[0.08] border border-gold/[0.12] flex items-center justify-center">
          <Icon size={16} className="text-gold" />
        </div>
        <span
          className={`inline-flex items-center gap-1 font-body text-xs font-medium
            ${positive ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </span>
      </div>
      <div className="font-display text-3xl text-off-white leading-none mb-1">{value}</div>
      <div className="font-body text-xs text-off-white/35 mt-1">{label}</div>
      {sub && <div className="font-body text-xs text-off-white/20 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3.5 py-2.5 border border-gold/15 shadow-glass">
      <p className="font-body text-xs text-off-white/40 mb-1">{label}</p>
      <p className="font-body text-sm text-gold font-medium">{fmt(payload[0]?.value)}</p>
      {payload[1] && (
        <p className="font-body text-xs text-off-white/40">{payload[1]?.value} orders</p>
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
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between"
        >
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-off-white">
              {greeting}, <span className="text-gradient">Chef</span>
            </h1>
            <p className="font-body text-xs text-off-white/30 mt-0.5">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              <span className="text-gold/50">Saturday</span> is your busiest day — heads up.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface border border-white/[0.06] rounded-xl px-3 py-2">
              <div className="live-dot" />
              <span className="font-body text-xs text-off-white/50">Live dashboard</span>
            </div>
            <button className="btn-primary text-xs py-2">+ New Order</button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard label="Today's Revenue" value="₹52,400" delta="+12.4%" positive icon={TrendingUp} sub="vs ₹46,600 yesterday" />
          <KpiCard label="Total Orders" value="234" delta="+8.2%" positive icon={ShoppingBag} sub="18 in last hour" />
          <KpiCard label="Reservations" value="18" delta="6 pending" positive icon={CalendarCheck} sub="Next at 7:30 PM" />
          <KpiCard label="Table Occupancy" value="78%" delta="+5%" positive icon={Users} sub="14 of 18 tables" />
        </motion.div>

        {/* Charts row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid lg:grid-cols-3 gap-4"
        >
          {/* Revenue area chart — 2/3 */}
          <motion.div variants={fadeUp} className="lg:col-span-2 stat-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-body text-xs text-off-white/35 uppercase tracking-widest mb-1">
                  Revenue This Week
                </p>
                <p className="font-display text-2xl text-off-white">₹5,22,000</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-confirmed text-emerald-400">
                  <TrendingUp size={10} /> +18.4%
                </span>
                <button className="btn-icon">
                  <MoreHorizontal size={15} />
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C89B3C" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#C89B3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(247,245,242,0.3)', fontFamily: 'Inter' }}
                />
                <YAxis
                  stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(247,245,242,0.3)', fontFamily: 'Inter' }}
                  tickFormatter={fmtK}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(200,155,60,0.15)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C89B3C"
                  strokeWidth={2}
                  fill="url(#goldGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#C89B3C', stroke: '#111', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Order breakdown donut — 1/3 */}
          <motion.div variants={fadeUp} className="stat-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs text-off-white/35 uppercase tracking-widest">
                Order Types
              </p>
              <button className="btn-icon">
                <MoreHorizontal size={15} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={orderTypes}
                    cx="50%" cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1B1B1B',
                      border: '1px solid rgba(200,155,60,0.15)',
                      borderRadius: 12,
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: '#F7F5F2',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 mt-2">
              {orderTypes.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="font-body text-xs text-off-white/50">{name}</span>
                  </div>
                  <span className="font-body text-xs font-medium text-off-white/70">{value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Live orders + Popular dishes */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid lg:grid-cols-3 gap-4"
        >
          {/* Live orders table — 2/3 */}
          <motion.div variants={fadeUp} className="lg:col-span-2 stat-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <p className="font-body text-sm font-medium text-off-white/70">Live Orders</p>
                <div className="live-dot" />
              </div>
              <a href="/orders" className="font-body text-xs text-gold/50 hover:text-gold flex items-center gap-1 transition-colors">
                View all <ChevronRight size={12} />
              </a>
            </div>

            <div className="table-container">
              <table className="premium">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Table</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>ETA</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {liveOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}
                    >
                      <td>
                        <span className="font-body text-xs font-medium text-off-white/60 font-mono">
                          {order.id}
                        </span>
                      </td>
                      <td>
                        <span className="font-body text-xs bg-surface-3 text-off-white/50 px-2 py-1 rounded-lg">
                          {order.table}
                        </span>
                      </td>
                      <td>
                        <span className="font-body text-xs text-off-white/50">{order.items} items</span>
                      </td>
                      <td>
                        <span className={`badge badge-${order.status}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-off-white/40 font-body text-xs">
                          {order.time !== '—' && <Clock size={11} />}
                          {order.time}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="font-body text-sm text-off-white/70 font-medium">
                          ₹{order.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Popular dishes — 1/3 */}
          <motion.div variants={fadeUp} className="stat-card">
            <div className="flex items-center justify-between mb-5">
              <p className="font-body text-sm font-medium text-off-white/70">Top Dishes</p>
              <span className="font-body text-xs text-off-white/25">Today</span>
            </div>

            <div className="space-y-3">
              {popularDishes.map(({ name, orders, revenue, trend }, i) => (
                <div key={name} className="group">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-body text-xs text-off-white/20 w-4">{i + 1}</span>
                      <span className="font-body text-sm text-off-white/70 group-hover:text-off-white transition-colors">
                        {name}
                      </span>
                    </div>
                    <span
                      className={`font-body text-xs flex items-center gap-0.5 flex-shrink-0
                        ${trend > 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}
                    >
                      {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(trend)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-6 mb-1.5">
                    <span className="font-body text-xs text-off-white/30">{orders} orders</span>
                    <span className="font-body text-xs text-gold/60">
                      ₹{revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="pl-6">
                    <div className="h-0.5 bg-surface-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(orders / 34) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full"
                      />
                    </div>
                  </div>
                  {i < popularDishes.length - 1 && (
                    <div className="border-b border-white/[0.04] mt-3" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Upcoming reservations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-5">
            <p className="font-body text-sm font-medium text-off-white/70">Upcoming Reservations</p>
            <a href="/reservations" className="font-body text-xs text-gold/50 hover:text-gold flex items-center gap-1 transition-colors">
              Manage <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Time</th>
                  <th>Table</th>
                  <th>Guests</th>
                  <th>Occasion</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.map((res, i) => (
                  <motion.tr
                    key={res.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-surface-3 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <span className="font-body text-xs text-off-white/40">
                            {res.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-body text-sm text-off-white/70">{res.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-body text-sm text-off-white/60">
                        <Clock size={12} className="text-gold/40" />
                        {res.time} PM
                      </div>
                    </td>
                    <td>
                      <span className="font-body text-xs bg-surface-3 text-off-white/50 px-2 py-1 rounded-lg">
                        {res.table}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-body text-xs text-off-white/50">
                        <Users size={12} />
                        {res.guests}
                      </div>
                    </td>
                    <td>
                      {res.occasion ? (
                        <span className="font-body text-xs text-gold/60 bg-gold/[0.06] px-2 py-0.5 rounded-full">
                          {res.occasion}
                        </span>
                      ) : (
                        <span className="text-off-white/20">—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-confirmed">Confirmed</span>
                    </td>
                    <td>
                      <button className="btn-icon w-7 h-7">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
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
