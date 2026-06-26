import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Clock, CheckCircle2, ChefHat, Filter, Plus, Search,
  MoreHorizontal, Download, ChevronDown, X, Check, Bell,
} from 'lucide-react';
import { useAdminSocket } from '@/hooks/useAdminSocket';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

// ─── Types ─────────────────────────────────────────────────────
interface OrderItem { name: string; qty: number; price: number }
interface Order {
  id: string; table: string; customer: string; phone: string;
  items: OrderItem[]; type: 'Dine In' | 'Takeaway' | 'Delivery';
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  payment: 'paid' | 'unpaid' | 'partial';
  amount: number; placed: string; notes?: string;
}

const ORDERS: Order[] = [
  {
    id: 'SVR-0091', table: 'T-03', customer: 'Arjun Mehta', phone: '+91 98765 43210',
    items: [{ name: 'Saffron Risotto', qty: 1, price: 1240 }, { name: 'Truffle Arancini', qty: 2, price: 800 }],
    type: 'Dine In', status: 'pending', payment: 'unpaid', amount: 2840, placed: '7:42 PM',
  },
  {
    id: 'SVR-0090', table: 'T-07', customer: 'Priya Sharma', phone: '+91 87654 32109',
    items: [{ name: 'Pan-Seared Duck', qty: 2, price: 1680 }, { name: 'Burrata', qty: 1, price: 950 }, { name: 'Fondant', qty: 2, price: 680 }],
    type: 'Dine In', status: 'preparing', payment: 'paid', amount: 5670, placed: '7:38 PM',
  },
  {
    id: 'SVR-0089', table: 'T-12', customer: 'Kavya Nair', phone: '+91 76543 21098',
    items: [{ name: 'Saffron Risotto', qty: 2, price: 1240 }, { name: 'Truffle Fries', qty: 2, price: 480 }],
    type: 'Takeaway', status: 'ready', payment: 'paid', amount: 3440, placed: '7:30 PM',
  },
  {
    id: 'SVR-0088', table: 'T-01', customer: 'Rohit Kumar', phone: '+91 65432 10987',
    items: [{ name: 'Grilled Sea Bass', qty: 1, price: 1920 }],
    type: 'Dine In', status: 'served', payment: 'paid', amount: 1920, placed: '7:18 PM',
  },
  {
    id: 'SVR-0087', table: '—', customer: 'Meera Verma', phone: '+91 54321 09876',
    items: [{ name: 'Saffron Risotto', qty: 2, price: 1240 }, { name: 'Panna Cotta', qty: 2, price: 520 }, { name: 'Elderflower', qty: 2, price: 420 }],
    type: 'Delivery', status: 'preparing', payment: 'paid', amount: 4360, placed: '7:15 PM', notes: 'Ring doorbell twice',
  },
  {
    id: 'SVR-0086', table: 'T-05', customer: 'Siddharth Rao', phone: '+91 43210 98765',
    items: [{ name: 'Elderflower Spritz', qty: 2, price: 420 }],
    type: 'Dine In', status: 'completed', payment: 'paid', amount: 840, placed: '7:02 PM',
  },
  {
    id: 'SVR-0085', table: 'T-11', customer: 'Ananya Patel', phone: '+91 32109 87654',
    items: [{ name: 'Pan-Seared Duck', qty: 2, price: 1680 }, { name: 'Burrata', qty: 1, price: 950 }],
    type: 'Dine In', status: 'cancelled', payment: 'unpaid', amount: 4310, placed: '6:55 PM',
  },
];

const STATUS_TABS = ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUSES: Order['status'][] = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

// ─── CSV export ────────────────────────────────────────────────
function exportCSV(orders: Order[]) {
  const rows = [
    ['Order ID', 'Customer', 'Table', 'Type', 'Items', 'Amount', 'Status', 'Payment', 'Placed'],
    ...orders.map(o => [
      o.id, o.customer, o.table, o.type,
      o.items.map(i => `${i.qty}x ${i.name}`).join('; '),
      o.amount, o.status, o.payment, o.placed,
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'orders.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Status update popover ─────────────────────────────────────
function StatusPopover({ current, onSelect, onClose }: {
  current: Order['status']; onSelect: (s: Order['status']) => void; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-8 z-50 bg-white rounded-2xl shadow-card-hover border border-black/[0.08] py-1.5 min-w-[140px]"
      onClick={e => e.stopPropagation()}
    >
      {STATUSES.map(s => (
        <button key={s} onClick={() => { onSelect(s); onClose(); }}
          className="w-full flex items-center gap-2 px-3.5 py-2 font-body text-xs text-left
                     hover:bg-black/[0.03] transition-colors">
          {s === current && <Check size={11} style={{ color: '#BF8B5E' }} />}
          {s !== current && <div className="w-[11px]" />}
          <span className={`badge badge-${s}`} style={{ padding: '1px 6px', fontSize: 10 }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        </button>
      ))}
    </motion.div>
  );
}

// ─── Row expand detail ─────────────────────────────────────────
function OrderDetail({ order }: { order: Order }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={9} className="!p-0">
        <div className="mx-4 mb-3 bg-black/[0.025] rounded-xl p-4 border border-black/[0.04]">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="section-label mb-2">Order Items</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-black/[0.04] last:border-0">
                  <span className="font-body text-xs text-charcoal/70">{item.qty}× {item.name}</span>
                  <span className="font-body text-xs font-medium text-charcoal/60">
                    ₹{(item.qty * item.price).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1">
                <span className="font-body text-xs font-semibold text-charcoal/60">Total</span>
                <span className="font-body text-sm font-semibold" style={{ color: '#BF8B5E' }}>
                  ₹{order.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div>
              <p className="section-label mb-2">Customer</p>
              <p className="font-body text-sm text-charcoal/70">{order.customer}</p>
              <p className="font-body text-xs text-charcoal/40 mt-0.5">{order.phone}</p>
            </div>
            {order.notes && (
              <div>
                <p className="section-label mb-2">Notes</p>
                <p className="font-body text-xs text-charcoal/60 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Orders page ───────────────────────────────────────────────
export function Orders() {
  const { activeRestaurant } = useAuth();
  const [orders, setOrders]         = useState<Order[]>(ORDERS);
  const [tab, setTab]               = useState<StatusTab>('All');
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [payFilter, setPayFilter]   = useState('All');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [statusMenu, setStatusMenu] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Real-time socket subscriptions
  useAdminSocket({
    restaurantId: activeRestaurant,
    onNewOrder: (payload) => {
      // Prepend the new order and show a toast
      const newOrder: Order = {
        id:       payload.orderNumber ?? payload.orderId,
        table:    payload.tableId ? `T-${payload.tableId.slice(-2)}` : '—',
        customer: payload.customerName ?? 'Guest',
        phone:    '',
        items:    (payload.items ?? []).map(i => ({ name: i.name, qty: i.quantity, price: 0 })),
        type:     payload.type === 'takeaway' ? 'Takeaway' : payload.type === 'delivery' ? 'Delivery' : 'Dine In',
        status:   'pending',
        payment:  'unpaid',
        amount:   payload.total,
        placed:   new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        notes:    payload.notes,
      };
      setOrders(prev => [newOrder, ...prev]);
      toast.custom(() => (
        <div className="flex items-center gap-3 bg-white border border-black/[0.08] rounded-2xl px-4 py-3 shadow-card-hover">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Bell size={14} className="text-amber-500" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-charcoal/80">New Order Received</p>
            <p className="font-body text-xs text-charcoal/40">
              {payload.orderNumber ?? payload.orderId} · {payload.itemCount} item{payload.itemCount !== 1 ? 's' : ''} · ₹{payload.total.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      ));
    },
    onOrderStatusUpdated: (payload) => {
      setOrders(prev => prev.map(o =>
        o.id === payload.orderNumber || o.id === payload.orderId
          ? { ...o, status: payload.status as Order['status'] }
          : o
      ));
    },
  });

  const updateStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const filtered = orders.filter(o => {
    const matchTab    = tab === 'All' || o.status === tab.toLowerCase();
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.table.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'All' || o.type === typeFilter;
    const matchPay    = payFilter  === 'All' || o.payment === payFilter.toLowerCase();
    return matchTab && matchSearch && matchType && matchPay;
  });

  const counts = {
    All: orders.length,
    Pending: orders.filter(o => o.status === 'pending').length,
    Preparing: orders.filter(o => o.status === 'preparing').length,
    Ready: orders.filter(o => o.status === 'ready').length,
    Completed: orders.filter(o => o.status === 'completed').length,
    Cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar" onClick={() => { setStatusMenu(null); setFilterOpen(false); }}>
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Orders</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">
              {orders.length} total today ·{' '}
              <span className="text-emerald-600 flex-inline items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />Live
              </span>
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <button onClick={() => exportCSV(filtered)}
              className="btn-ghost text-xs gap-1.5">
              <Download size={13} /> Export CSV
            </button>
            <button className="btn-primary text-xs gap-1.5"><Plus size={13} /> New Order</button>
          </motion.div>
        </motion.div>

        {/* KPI strip */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Orders',  value: counts.Pending + counts.Preparing + counts.Ready, icon: ShoppingBag, color: '#BF8B5E' },
            { label: 'Avg Prep Time',  value: '14 min',       icon: Clock,        color: '#3b82f6' },
            { label: 'Ready to Serve', value: counts.Ready,   icon: CheckCircle2, color: '#10b981' },
            { label: 'In Kitchen',     value: counts.Preparing, icon: ChefHat,    color: '#f59e0b' },
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

        {/* Table card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="stat-card !p-0 overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-black/[0.05]">
            {/* Search */}
            <div className="relative max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search orders…" className="input pl-8 py-2 text-xs w-56" />
            </div>

            {/* Status tabs */}
            <div className="flex items-center gap-0.5 bg-black/[0.04] rounded-xl p-1 overflow-x-auto no-scrollbar">
              {STATUS_TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="font-body text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150"
                  style={{
                    backgroundColor: tab === t ? '#260B10' : 'transparent',
                    color: tab === t ? '#fff' : 'rgba(26,26,26,0.45)',
                  }}>
                  {t}
                  <span className="ml-1 opacity-50">{counts[t] ?? filtered.length}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="relative ml-auto" onClick={e => e.stopPropagation()}>
              <button onClick={() => setFilterOpen(o => !o)}
                className={`btn-ghost text-xs gap-1.5 ${filterOpen ? 'bg-black/[0.06]' : ''}`}>
                <Filter size={13} /> Filters
                {(typeFilter !== 'All' || payFilter !== 'All') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-card-hover border border-black/[0.08] p-4 w-56 space-y-4"
                  >
                    <div>
                      <p className="section-label mb-2">Order Type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['All', 'Dine In', 'Takeaway', 'Delivery'].map(t => (
                          <button key={t} onClick={() => setTypeFilter(t)}
                            className="font-body text-xs px-2.5 py-1 rounded-lg transition-all"
                            style={{
                              backgroundColor: typeFilter === t ? '#260B10' : 'rgba(0,0,0,0.05)',
                              color: typeFilter === t ? '#fff' : 'rgba(26,26,26,0.5)',
                            }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="section-label mb-2">Payment Status</p>
                      <div className="flex gap-1.5">
                        {['All', 'Paid', 'Unpaid'].map(p => (
                          <button key={p} onClick={() => setPayFilter(p)}
                            className="font-body text-xs px-2.5 py-1 rounded-lg transition-all"
                            style={{
                              backgroundColor: payFilter === p ? '#260B10' : 'rgba(0,0,0,0.05)',
                              color: payFilter === p ? '#fff' : 'rgba(26,26,26,0.5)',
                            }}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => { setTypeFilter('All'); setPayFilter('All'); }}
                      className="font-body text-xs text-charcoal/40 flex items-center gap-1 hover:text-charcoal/60">
                      <X size={11} /> Clear filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th className="w-8" />
                  <th>#</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Placed</th>
                  <th className="text-right">Amount</th>
                  <th />
                </tr>
              </thead>
              <AnimatePresence>
                <tbody>
                  {filtered.map((o, i) => (
                    <>
                      <motion.tr key={o.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="cursor-pointer"
                        onClick={() => setExpanded(e => e === o.id ? null : o.id)}>
                        <td>
                          <ChevronDown size={12} className="text-charcoal/30 transition-transform duration-200"
                            style={{ transform: expanded === o.id ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </td>
                        <td><span className="font-mono text-xs text-charcoal/50">{o.id}</span></td>
                        <td className="font-body text-sm text-charcoal/70">{o.customer}</td>
                        <td>
                          <span className="font-body text-xs bg-black/[0.05] text-charcoal/60 px-2 py-1 rounded-lg">{o.table}</span>
                        </td>
                        <td>
                          <span className="font-body text-xs text-charcoal/50">{o.type}</span>
                        </td>
                        <td><span className="font-body text-xs text-charcoal/50">{o.items.length} items</span></td>
                        <td>
                          <div className="relative" onClick={e => { e.stopPropagation(); setStatusMenu(m => m === o.id ? null : o.id); }}>
                            <span className={`badge badge-${o.status} cursor-pointer hover:opacity-80 transition-opacity`}>
                              {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                            </span>
                            <AnimatePresence>
                              {statusMenu === o.id && (
                                <StatusPopover
                                  current={o.status}
                                  onSelect={s => updateStatus(o.id, s)}
                                  onClose={() => setStatusMenu(null)}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                        <td>
                          <span className={`font-body text-xs px-2 py-1 rounded-lg ${
                            o.payment === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {o.payment.charAt(0).toUpperCase() + o.payment.slice(1)}
                          </span>
                        </td>
                        <td className="font-body text-xs text-charcoal/40">{o.placed}</td>
                        <td className="text-right font-body text-sm font-medium text-charcoal/70">
                          ₹{o.amount.toLocaleString('en-IN')}
                        </td>
                        <td><button className="btn-icon w-7 h-7" onClick={e => e.stopPropagation()}><MoreHorizontal size={14} /></button></td>
                      </motion.tr>
                      <AnimatePresence>
                        {expanded === o.id && <OrderDetail key={`${o.id}-detail`} order={o} />}
                      </AnimatePresence>
                    </>
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center font-body text-sm text-charcoal/30">No orders found</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
