import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, CheckCircle2, Clock, Search, MoreHorizontal, Download } from 'lucide-react';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

const PAYMENTS = [
  { id: 'PAY-8421', order: 'SVR-0089', guest: 'Kavya Nair',      amount: 2240, method: 'Card',  status: 'completed', time: '7:48 PM' },
  { id: 'PAY-8420', order: 'SVR-0088', guest: 'Rohit Kumar',     amount: 960,  method: 'UPI',   status: 'completed', time: '7:35 PM' },
  { id: 'PAY-8419', order: 'SVR-0087', guest: 'Meera Verma',     amount: 4200, method: 'Card',  status: 'completed', time: '7:22 PM' },
  { id: 'PAY-8418', order: 'SVR-0086', guest: 'Siddharth R.',    amount: 540,  method: 'Cash',  status: 'completed', time: '7:10 PM' },
  { id: 'PAY-8417', order: 'SVR-0085', guest: 'Ananya Patel',    amount: 1800, method: 'Card',  status: 'refunded',  time: '6:58 PM' },
  { id: 'PAY-8416', order: 'SVR-0084', guest: 'Priya Sharma',    amount: 3200, method: 'UPI',   status: 'completed', time: '6:44 PM' },
  { id: 'PAY-8415', order: 'SVR-0083', guest: 'Arjun Mehta',     amount: 1640, method: 'Card',  status: 'pending',   time: '6:30 PM' },
];

const METHOD_CFG: Record<string, string> = {
  Card: '#3b82f6',
  UPI:  '#8b5cf6',
  Cash: '#10b981',
};

const STATUS_CFG: Record<string, { bg: string; text: string; border: string }> = {
  completed: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  pending:   { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  refunded:  { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
};

export function Payments() {
  const [search, setSearch] = useState('');

  const filtered = PAYMENTS.filter(p =>
    p.guest.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const todayRevenue = PAYMENTS
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Payments</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">Today · Mon 23 June 2026</p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <button className="btn-ghost text-xs gap-1.5"><Download size={13} /> Export</button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Today\'s Revenue', value: `₹${todayRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#BF8B5E' },
            { label: 'Completed',        value: String(PAYMENTS.filter(p => p.status === 'completed').length), icon: CheckCircle2, color: '#10b981' },
            { label: 'Pending',          value: String(PAYMENTS.filter(p => p.status === 'pending').length), icon: Clock, color: '#f59e0b' },
            { label: 'Refunded',         value: String(PAYMENTS.filter(p => p.status === 'refunded').length), icon: CreditCard, color: '#ef4444' },
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

        {/* Payment methods breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 gap-3">
          {Object.entries(METHOD_CFG).map(([method, color]) => {
            const methodPays = PAYMENTS.filter(p => p.method === method && p.status === 'completed');
            const total = methodPays.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={method} className="stat-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-body text-sm text-charcoal/60">{method}</span>
                </div>
                <p className="font-display text-xl text-charcoal">₹{total.toLocaleString('en-IN')}</p>
                <p className="font-body text-xs text-charcoal/35 mt-0.5">{methodPays.length} transactions</p>
              </div>
            );
          })}
        </motion.div>

        {/* Transactions table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card !p-0 overflow-hidden">

          <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.05]">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions…" className="input w-full pl-8 py-2 text-xs" />
            </div>
          </div>

          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th>Payment ID</th><th>Order</th><th>Guest</th>
                  <th>Method</th><th>Status</th><th>Time</th>
                  <th className="text-right">Amount</th><th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const sc = STATUS_CFG[p.status];
                  const mc = METHOD_CFG[p.method];
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}>
                      <td><span className="font-mono text-xs text-charcoal/50">{p.id}</span></td>
                      <td><span className="font-mono text-xs text-charcoal/40">{p.order}</span></td>
                      <td><span className="font-body text-sm text-charcoal/70">{p.guest}</span></td>
                      <td>
                        <span className="font-body text-xs px-2 py-1 rounded-lg font-medium"
                          style={{ backgroundColor: `${mc}15`, color: mc }}>
                          {p.method}
                        </span>
                      </td>
                      <td>
                        <span className="font-body text-xs px-2 py-1 rounded-lg"
                          style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td><span className="font-body text-xs text-charcoal/40">{p.time}</span></td>
                      <td className="text-right">
                        <span className={`font-body text-sm font-semibold ${p.status === 'refunded' ? 'text-red-500' : 'text-charcoal/70'}`}>
                          {p.status === 'refunded' ? '-' : ''}₹{p.amount.toLocaleString('en-IN')}
                        </span>
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
