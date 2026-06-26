import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart, Line, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, ShoppingBag, CalendarCheck, UserPlus,
  TrendingUp, TrendingDown, Clock, ChevronRight, RefreshCw,
} from 'lucide-react';

// ─── Mock data ─────────────────────────────────────────────────
const MOCK: OverviewData = {
  revenue: 52400,
  ordersCount: 234,
  ordersChangePct: 8.2,
  reservations: 18,
  newCustomers: 12,
  revenueWeek: [
    { day: 'Mon', revenue: 42000 },
    { day: 'Tue', revenue: 58000 },
    { day: 'Wed', revenue: 49000 },
    { day: 'Thu', revenue: 72000 },
    { day: 'Fri', revenue: 91000 },
    { day: 'Sat', revenue: 124000 },
    { day: 'Sun', revenue: 86000 },
  ],
  orderTypes: [
    { name: 'Dine In',  value: 65, color: '#BF8B5E' },
    { name: 'Takeaway', value: 22, color: '#D9B89C' },
    { name: 'Delivery', value: 13, color: '#a67748' },
  ],
  topItems: [
    { name: 'Saffron Risotto',    orders: 34 },
    { name: 'Pan-Seared Duck',    orders: 28 },
    { name: 'Truffle Arancini',   orders: 22 },
    { name: 'Chocolate Fondant',  orders: 19 },
    { name: 'Elderflower Spritz', orders: 16 },
  ],
  recentOrders: [
    { id: 'SVR-0091', customer: 'Arjun M.',  items: 3, type: 'Dine In',  status: 'pending',   amount: 1640, time: '7:42 PM' },
    { id: 'SVR-0090', customer: 'Priya S.',  items: 5, type: 'Dine In',  status: 'preparing', amount: 3100, time: '7:38 PM' },
    { id: 'SVR-0089', customer: 'Kavya N.',  items: 4, type: 'Takeaway', status: 'ready',     amount: 2240, time: '7:30 PM' },
    { id: 'SVR-0088', customer: 'Rohit K.',  items: 2, type: 'Dine In',  status: 'served',    amount: 960,  time: '7:18 PM' },
    { id: 'SVR-0087', customer: 'Meera V.',  items: 6, type: 'Delivery', status: 'preparing', amount: 4200, time: '7:15 PM' },
  ],
  recentReservations: [
    { name: 'Priya Sharma', guests: 4, time: '19:30', table: 'T-08', status: 'confirmed', occasion: 'Birthday' },
    { name: 'Arjun Mehta',  guests: 2, time: '20:00', table: 'T-02', status: 'confirmed', occasion: null },
    { name: 'Kavya Nair',   guests: 6, time: '20:30', table: 'T-14', status: 'confirmed', occasion: 'Anniversary' },
    { name: 'Rahul Singh',  guests: 3, time: '21:00', table: 'T-06', status: 'confirmed', occasion: null },
    { name: 'Sneha Patel',  guests: 5, time: '21:30', table: 'T-11', status: 'pending',   occasion: 'Graduation' },
  ],
};

interface OverviewData {
  revenue: number;
  ordersCount: number;
  ordersChangePct: number;
  reservations: number;
  newCustomers: number;
  revenueWeek: { day: string; revenue: number }[];
  orderTypes: { name: string; value: number; color: string }[];
  topItems: { name: string; orders: number }[];
  recentOrders: { id: string; customer: string; items: number; type: string; status: string; amount: number; time: string }[];
  recentReservations: { name: string; guests: number; time: string; table: string; status: string; occasion: string | null }[];
}

const fetchOverview = async (): Promise<OverviewData> => {
  await new Promise(r => setTimeout(r, 60));
  return MOCK;
};

// ─── Helpers ───────────────────────────────────────────────────
const fmtK = (n: number) => (n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`);
const fmt  = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const easeOut = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut, delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Count-up hook ─────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - (1 - p) ** 3;
      setVal(Math.round(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// ─── KPI Card ──────────────────────────────────────────────────
function KpiCard({
  label, raw, prefix = '', suffix = '', delta, positive, icon: Icon, sub,
}: {
  label: string; raw: number; prefix?: string; suffix?: string;
  delta: string; positive: boolean; icon: React.ElementType; sub?: string;
}) {
  const count = useCountUp(raw);
  return (
    <motion.div variants={fadeUp} className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(191,139,94,0.1)' }}>
          <Icon size={16} style={{ color: '#BF8B5E' }} />
        </div>
        <span className={`inline-flex items-center gap-1 font-body text-xs font-medium
          ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {delta}
        </span>
      </div>
      <div className="font-display text-3xl text-charcoal leading-none mb-1">
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="font-body text-xs text-charcoal/40 mt-1">{label}</div>
      {sub && <div className="font-body text-xs text-charcoal/25 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Chart tooltip ─────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-card-hover border border-black/[0.06]">
      <p className="font-body text-xs text-charcoal/40 mb-1">{label}</p>
      <p className="font-body text-sm font-semibold" style={{ color: '#BF8B5E' }}>
        {typeof v === 'number' && v > 999 ? fmt(v) : v}
      </p>
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────────
export function Overview() {
  const now   = new Date();
  const hour  = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data = MOCK, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
    refetchInterval: 30_000,
  });

  const lastUpdated = new Date(dataUpdatedAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

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
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 bg-white border border-black/[0.06] rounded-xl px-3 py-2 font-body text-xs text-charcoal/50 hover:text-charcoal/70 transition-colors"
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Refreshing…' : `Updated ${lastUpdated}`}
            </button>
            <div className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-xl px-3 py-2">
              <div className="live-dot" />
              <span className="font-body text-xs text-charcoal/50">Live · 30s</span>
            </div>
          </motion.div>
        </motion.div>

        {/* KPI row */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Today's Revenue"     raw={data.revenue}       prefix="₹"
            delta="+12.4%" positive icon={DollarSign}    sub="vs ₹46,600 yesterday" />
          <KpiCard label="Total Orders"         raw={data.ordersCount}
            delta={`+${data.ordersChangePct}%`} positive icon={ShoppingBag}  sub="18 in last hour" />
          <KpiCard label="Active Reservations"  raw={data.reservations}
            delta="6 pending" positive icon={CalendarCheck} sub="Next at 7:30 PM" />
          <KpiCard label="New Customers"        raw={data.newCustomers}
            delta="+15%" positive icon={UserPlus}     sub="Since last week" />
        </motion.div>

        {/* Charts row */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid lg:grid-cols-3 gap-4">

          {/* 7-day revenue line chart */}
          <motion.div variants={fadeUp} className="lg:col-span-2 stat-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-label mb-1">Revenue — Last 7 Days</p>
                <p className="font-display text-2xl text-charcoal">₹5,22,000</p>
              </div>
              <span className="badge badge-confirmed">
                <TrendingUp size={10} /> +18.4%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.revenueWeek} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BF8B5E" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#BF8B5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <YAxis stroke="transparent" tickFormatter={fmtK}
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.35)', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(191,139,94,0.2)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="revenue" stroke="#BF8B5E" strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#BF8B5E', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#BF8B5E', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Orders donut */}
          <motion.div variants={fadeUp} className="stat-card flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Order Types</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={155}>
                <PieChart>
                  <Pie data={data.orderTypes} cx="50%" cy="50%"
                    innerRadius={46} outerRadius={68} paddingAngle={3}
                    dataKey="value" stroke="none">
                    {data.orderTypes.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{
                    background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 12, fontFamily: 'Inter', fontSize: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-1">
              {data.orderTypes.map(({ name, value, color }) => (
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

        {/* Second row: top items + recent orders + recent reservations */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid lg:grid-cols-3 gap-4">

          {/* Top selling items horizontal bar */}
          <motion.div variants={fadeUp} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">Top Selling Items</p>
              <span className="font-body text-xs text-charcoal/25">Today</span>
            </div>
            <ResponsiveContainer width="100%" height={165}>
              <BarChart data={data.topItems} layout="vertical"
                margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <XAxis type="number" stroke="transparent"
                  tick={{ fontSize: 10, fill: 'rgba(26,26,26,0.3)', fontFamily: 'Inter' }} />
                <YAxis type="category" dataKey="name" width={108} stroke="transparent"
                  tick={{ fontSize: 11, fill: 'rgba(26,26,26,0.55)', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="orders" fill="#BF8B5E" radius={[0, 4, 4, 0]}
                  background={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent orders */}
          <motion.div variants={fadeUp} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="font-body text-sm font-medium text-charcoal/60">Recent Orders</p>
                <div className="live-dot" />
              </div>
              <a href="/orders" className="font-body text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'rgba(191,139,94,0.7)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#BF8B5E')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(191,139,94,0.7)')}>
                View all <ChevronRight size={11} />
              </a>
            </div>
            <div className="space-y-0">
              {data.recentOrders.map(o => (
                <div key={o.id}
                  className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-2xs text-charcoal/35">{o.id}</span>
                      <span className={`badge badge-${o.status}`}
                        style={{ padding: '2px 8px', fontSize: 10 }}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </div>
                    <p className="font-body text-xs text-charcoal/55 truncate">
                      {o.customer} · {o.items} items · {o.type}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-body text-xs font-semibold text-charcoal/70">
                      ₹{o.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="font-body text-2xs text-charcoal/30">{o.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent reservations */}
          <motion.div variants={fadeUp} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-sm font-medium text-charcoal/60">Upcoming Reservations</p>
              <a href="/reservations" className="font-body text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'rgba(191,139,94,0.7)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#BF8B5E')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(191,139,94,0.7)')}>
                Manage <ChevronRight size={11} />
              </a>
            </div>
            <div className="space-y-0">
              {data.recentReservations.map(r => (
                <div key={r.name}
                  className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
                  <div className="w-7 h-7 rounded-full bg-black/[0.05] flex items-center justify-center flex-shrink-0">
                    <span className="font-body text-xs text-charcoal/40">{r.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-medium text-charcoal/70 truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-body text-2xs text-charcoal/35 flex items-center gap-0.5">
                        <Clock size={9} />{r.time}
                      </span>
                      <span className="font-body text-2xs bg-black/[0.05] text-charcoal/50 px-1.5 py-0.5 rounded-md">
                        {r.table}
                      </span>
                      {r.occasion && (
                        <span className="font-body text-2xs" style={{ color: '#a67748' }}>{r.occasion}</span>
                      )}
                    </div>
                  </div>
                  <span className={`badge badge-${r.status}`} style={{ padding: '2px 8px', fontSize: 10 }}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
