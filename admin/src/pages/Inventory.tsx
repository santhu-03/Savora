import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, TrendingDown, Plus, Search,
  MoreHorizontal, X, Check, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Types ─────────────────────────────────────────────────────
interface InventoryItem {
  id: number; name: string; category: string; unit: string;
  stock: number; threshold: number; cost: number;
  supplier: string; usage7d: number[];
}

const ITEMS: InventoryItem[] = [
  { id: 1,  name: 'Truffle Oil',         category: 'Pantry',   unit: 'bottles', stock: 2,   threshold: 5,  cost: 1800, supplier: 'Gourmet Imports',    usage7d: [1,0,1,1,0,1,1] },
  { id: 2,  name: 'Saffron',             category: 'Spices',   unit: 'grams',   stock: 45,  threshold: 30, cost: 450,  supplier: 'Rajasthan Spice Co.', usage7d: [5,6,5,7,6,8,6] },
  { id: 3,  name: 'Arborio Rice',        category: 'Grains',   unit: 'kg',      stock: 12,  threshold: 8,  cost: 280,  supplier: 'Italian Foods India', usage7d: [2,2,3,2,3,4,3] },
  { id: 4,  name: 'Duck Breast',         category: 'Proteins', unit: 'kg',      stock: 3.5, threshold: 5,  cost: 1200, supplier: 'Premium Poultry',     usage7d: [1,1,1,2,1,2,2] },
  { id: 5,  name: 'Burrata Cheese',      category: 'Dairy',    unit: 'pcs',     stock: 8,   threshold: 6,  cost: 350,  supplier: 'Artisan Dairy',       usage7d: [2,3,2,3,2,3,3] },
  { id: 6,  name: 'Dark Chocolate 70%',  category: 'Pantry',   unit: 'kg',      stock: 6,   threshold: 4,  cost: 680,  supplier: 'Callebaut India',     usage7d: [1,1,1,1,2,1,2] },
  { id: 7,  name: 'Heavy Cream',         category: 'Dairy',    unit: 'liters',  stock: 22,  threshold: 10, cost: 120,  supplier: 'Amul B2B',            usage7d: [3,3,4,3,4,5,4] },
  { id: 8,  name: 'Sea Bass (whole)',    category: 'Seafood',  unit: 'kg',      stock: 1.2, threshold: 4,  cost: 960,  supplier: 'Coastal Fresh',       usage7d: [1,2,1,2,1,2,1] },
  { id: 9,  name: 'Elderflower Cordial', category: 'Drinks',   unit: 'bottles', stock: 14,  threshold: 6,  cost: 480,  supplier: 'Gourmet Imports',     usage7d: [3,4,3,4,5,4,5] },
  { id: 10, name: 'Parmesan',            category: 'Dairy',    unit: 'kg',      stock: 3,   threshold: 2,  cost: 1600, supplier: 'Artisan Dairy',       usage7d: [1,1,1,2,1,1,1] },
];

const CATEGORIES = ['All', 'Pantry', 'Spices', 'Grains', 'Proteins', 'Dairy', 'Seafood', 'Drinks'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function stockStatus(stock: number, thr: number) {
  const r = stock / thr;
  if (r <= 0.5) return { label: 'Critical', bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', bar: '#ef4444' };
  if (r <= 1)   return { label: 'Low',      bg: '#fffbeb', text: '#92400e', border: '#fcd34d', bar: '#f59e0b' };
  return               { label: 'OK',       bg: '#f0fdf4', text: '#166534', border: '#86efac', bar: '#22c55e' };
}

// ─── Micro usage chart ─────────────────────────────────────────
function MiniUsageChart({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ day: DAYS[i], v }));
  return (
    <ResponsiveContainer width={80} height={28}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BF8B5E" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#BF8B5E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#BF8B5E" strokeWidth={1.5}
          fill="url(#mg)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Item modal ────────────────────────────────────────────────
function ItemModal({ item, categories, onClose, onSave }: {
  item: Partial<InventoryItem> | null;
  categories: string[];
  onClose: () => void;
  onSave: (d: Partial<InventoryItem>) => void;
}) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState<Partial<InventoryItem>>(item ?? {
    name: '', category: 'Pantry', unit: 'kg', stock: 0, threshold: 5, cost: 0, supplier: '',
  });
  const set = (k: keyof InventoryItem, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-charcoal">{isEdit ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <div className="space-y-3.5">
          <div><label className="section-label block mb-1.5">Item Name</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)} className="input w-full" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="section-label block mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input w-full">
                {categories.slice(1).map(c => <option key={c}>{c}</option>)}
              </select></div>
            <div><label className="section-label block mb-1.5">Unit</label>
              <input value={form.unit ?? ''} onChange={e => set('unit', e.target.value)} className="input w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="section-label block mb-1.5">Current Stock</label>
              <input type="number" value={form.stock ?? ''} onChange={e => set('stock', Number(e.target.value))} className="input w-full" /></div>
            <div><label className="section-label block mb-1.5">Min Threshold</label>
              <input type="number" value={form.threshold ?? ''} onChange={e => set('threshold', Number(e.target.value))} className="input w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="section-label block mb-1.5">Unit Cost (₹)</label>
              <input type="number" value={form.cost ?? ''} onChange={e => set('cost', Number(e.target.value))} className="input w-full" /></div>
            <div><label className="section-label block mb-1.5">Supplier</label>
              <input value={form.supplier ?? ''} onChange={e => set('supplier', e.target.value)} className="input w-full" /></div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} disabled={!form.name}
            className="btn-primary flex-1 disabled:opacity-40">
            <Check size={14} /> {isEdit ? 'Save' : 'Add Item'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Log transaction modal ─────────────────────────────────────
function LogModal({ item, onClose, onLog }: {
  item: InventoryItem;
  onClose: () => void;
  onLog: (id: number, type: 'add' | 'remove' | 'adjust', qty: number) => void;
}) {
  const [type, setType] = useState<'add' | 'remove' | 'adjust'>('add');
  const [qty, setQty]   = useState(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-card-hover w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-charcoal">Log Transaction</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <p className="font-body text-sm text-charcoal/60 mb-4">
          {item.name} · Current: <span className="font-semibold text-charcoal">{item.stock} {item.unit}</span>
        </p>
        <div className="flex gap-2 mb-4">
          {([['add', ArrowUp, '#10b981'], ['remove', ArrowDown, '#ef4444'], ['adjust', Minus, '#f59e0b']] as const).map(([t, Icon, color]) => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all"
              style={{
                backgroundColor: type === t ? `${color}10` : 'transparent',
                borderColor: type === t ? color : 'rgba(0,0,0,0.1)',
                color: type === t ? color : 'rgba(26,26,26,0.4)',
              }}>
              <Icon size={16} />
              <span className="font-body text-xs capitalize">{t}</span>
            </button>
          ))}
        </div>
        <div>
          <label className="section-label block mb-1.5">Quantity ({item.unit})</label>
          <input type="number" min={0} value={qty} onChange={e => setQty(Number(e.target.value))}
            className="input w-full" />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={() => { onLog(item.id, type, qty); onClose(); }}
            className="btn-primary flex-1">
            Log Transaction
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Inventory page ─────────────────────────────────────────────
export function Inventory() {
  const [items, setItems]     = useState<InventoryItem[]>(ITEMS);
  const [search, setSearch]   = useState('');
  const [category, setCat]    = useState('All');
  const [itemModal, setItemModal] = useState<Partial<InventoryItem> | null | undefined>(undefined);
  const [logTarget, setLogTarget] = useState<InventoryItem | null>(null);

  const filtered = items.filter(it => {
    const matchCat = category === 'All' || it.category === category;
    const matchS   = it.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchS;
  });

  const critical = items.filter(it => stockStatus(it.stock, it.threshold).label === 'Critical').length;
  const low      = items.filter(it => stockStatus(it.stock, it.threshold).label === 'Low').length;

  const saveItem = (data: Partial<InventoryItem>) => {
    if (data.id) {
      setItems(prev => prev.map(it => it.id === data.id ? { ...it, ...data } as InventoryItem : it));
    } else {
      const newItem: InventoryItem = {
        id: Math.max(...items.map(i => i.id)) + 1,
        name: data.name ?? '',
        category: data.category ?? 'Pantry',
        unit: data.unit ?? 'kg',
        stock: data.stock ?? 0,
        threshold: data.threshold ?? 5,
        cost: data.cost ?? 0,
        supplier: data.supplier ?? '',
        usage7d: [0,0,0,0,0,0,0],
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const logTransaction = (id: number, type: 'add' | 'remove' | 'adjust', qty: number) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const newStock = type === 'add'    ? it.stock + qty
                     : type === 'remove' ? Math.max(0, it.stock - qty)
                     : qty;
      return { ...it, stock: newStock };
    }));
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Inventory</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">
              {items.length} items · {critical} critical · {low} low
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex gap-2">
            <button className="btn-ghost text-xs">Order Supplies</button>
            <button onClick={() => setItemModal(null)} className="btn-primary text-xs gap-1.5">
              <Plus size={13} /> Add Item
            </button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total SKUs',     value: items.length, icon: Package,       color: '#BF8B5E' },
            { label: 'Critical Stock', value: critical,     icon: AlertTriangle, color: '#ef4444' },
            { label: 'Low Stock',      value: low,          icon: TrendingDown,  color: '#f59e0b' },
            { label: 'Suppliers',      value: [...new Set(items.map(i => i.supplier))].length, icon: Package, color: '#3b82f6' },
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

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.05] flex-wrap">
            <div className="relative max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search inventory…" className="input pl-8 py-2 text-xs w-52" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className="font-body text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: category === c ? '#260B10' : 'transparent',
                    color: category === c ? '#fff' : 'rgba(26,26,26,0.4)',
                  }}>{c}</button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table className="premium">
              <thead>
                <tr>
                  <th>Item</th><th>Category</th><th>Stock Level</th>
                  <th>Status</th><th>7d Usage</th><th>Unit Cost</th>
                  <th>Supplier</th><th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((it, i) => {
                  const s   = stockStatus(it.stock, it.threshold);
                  const pct = Math.min((it.stock / (it.threshold * 2)) * 100, 100);
                  return (
                    <motion.tr key={it.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.025 }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${s.bar}15` }}>
                            <Package size={13} style={{ color: s.bar }} />
                          </div>
                          <span className="font-body text-sm font-medium text-charcoal/80">{it.name}</span>
                        </div>
                      </td>
                      <td><span className="font-body text-xs text-charcoal/50">{it.category}</span></td>
                      <td>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between">
                            <span className="font-body text-xs font-semibold text-charcoal/70">
                              {it.stock} {it.unit}
                            </span>
                            <span className="font-body text-2xs text-charcoal/35">min {it.threshold}</span>
                          </div>
                          <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: s.bar }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-body text-xs px-2 py-1 rounded-lg border"
                          style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}>
                          {s.label}
                        </span>
                      </td>
                      <td><MiniUsageChart data={it.usage7d} /></td>
                      <td>
                        <span className="font-body text-sm text-charcoal/60">
                          ₹{it.cost.toLocaleString('en-IN')}/{it.unit}
                        </span>
                      </td>
                      <td><span className="font-body text-xs text-charcoal/40">{it.supplier}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setLogTarget(it)}
                            className="font-body text-2xs px-2 py-1 rounded-lg transition-colors"
                            style={{ backgroundColor: 'rgba(191,139,94,0.1)', color: '#a67748' }}>
                            Log
                          </button>
                          <button onClick={() => setItemModal(it)} className="btn-icon w-7 h-7">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {itemModal !== undefined && (
          <ItemModal item={itemModal} categories={CATEGORIES}
            onClose={() => setItemModal(undefined)} onSave={saveItem} />
        )}
        {logTarget && (
          <LogModal item={logTarget} onClose={() => setLogTarget(null)} onLog={logTransaction} />
        )}
      </AnimatePresence>
    </div>
  );
}
