import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, Users, Clock, Plus, Search, MoreHorizontal,
  List, LayoutGrid, X,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Types ─────────────────────────────────────────────────────
interface Reservation {
  id: string; name: string; guests: number; time: string; endTime: string;
  table: string; status: 'confirmed' | 'pending' | 'cancelled' | 'seated';
  occasion: string | null; phone: string; notes?: string;
}

const RESERVATIONS: Reservation[] = [
  { id: 'R001', name: 'Priya Sharma',   guests: 4, time: '19:30', endTime: '21:00', table: 'T-08', status: 'confirmed',  occasion: 'Birthday',    phone: '+91 98765 43210', notes: 'Birthday cake at 9 PM' },
  { id: 'R002', name: 'Arjun Mehta',    guests: 2, time: '20:00', endTime: '21:30', table: 'T-02', status: 'confirmed',  occasion: null,          phone: '+91 87654 32109' },
  { id: 'R003', name: 'Kavya Nair',     guests: 6, time: '20:30', endTime: '22:30', table: 'T-14', status: 'confirmed',  occasion: 'Anniversary', phone: '+91 76543 21098' },
  { id: 'R004', name: 'Rahul Singh',    guests: 3, time: '21:00', endTime: '22:30', table: 'T-06', status: 'confirmed',  occasion: null,          phone: '+91 65432 10987' },
  { id: 'R005', name: 'Sneha Patel',    guests: 5, time: '21:30', endTime: '23:00', table: 'T-11', status: 'pending',    occasion: 'Graduation',  phone: '+91 54321 09876' },
  { id: 'R006', name: 'Vikram Bose',    guests: 2, time: '19:00', endTime: '20:30', table: 'T-04', status: 'seated',     occasion: null,          phone: '+91 43210 98765' },
  { id: 'R007', name: 'Ananya Gupta',   guests: 4, time: '19:30', endTime: '21:00', table: 'T-09', status: 'seated',     occasion: 'Work dinner', phone: '+91 32109 87654' },
  { id: 'R008', name: 'Kiran Reddy',    guests: 2, time: '22:00', endTime: '23:30', table: 'T-03', status: 'cancelled',  occasion: null,          phone: '+91 21098 76543' },
];

const STATUS_CFG = {
  confirmed: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', dot: '#3b82f6' },
  pending:   { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', dot: '#f59e0b' },
  cancelled: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' },
  seated:    { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#22c55e' },
};

const TIME_SLOTS = ['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00'];
const TABLES_TL  = ['T-02','T-03','T-04','T-06','T-08','T-09','T-11','T-14'];

// ─── Helpers ───────────────────────────────────────────────────
function timeToFraction(t: string) {
  const [h, m] = t.split(':').map(Number);
  return ((h - 18) * 60 + m) / (5 * 60); // 5 hours window 18:00–23:00
}

// ─── New Reservation Modal ─────────────────────────────────────
function NewReservationModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (r: Partial<Reservation>) => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '', guests: 2, time: '19:30', table: 'T-02', occasion: '' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-charcoal">New Reservation</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="section-label block mb-1.5">Guest Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Full name" className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 …" className="input w-full" />
            </div>
            <div>
              <label className="section-label block mb-1.5">Guests</label>
              <input type="number" min={1} max={20} value={form.guests}
                onChange={e => set('guests', parseInt(e.target.value))}
                className="input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1.5">Time</label>
              <select value={form.time} onChange={e => set('time', e.target.value)} className="input w-full">
                {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1.5">Table</label>
              <select value={form.table} onChange={e => set('table', e.target.value)} className="input w-full">
                {TABLES_TL.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="section-label block mb-1.5">Occasion (optional)</label>
            <input value={form.occasion} onChange={e => set('occasion', e.target.value)}
              placeholder="Birthday, Anniversary…" className="input w-full" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            disabled={!form.name}
            className="btn-primary flex-1 disabled:opacity-40">
            Confirm Reservation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reservations page ─────────────────────────────────────────
export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>(RESERVATIONS);
  const [view, setView]     = useState<'list' | 'timeline'>('list');
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const filtered = reservations.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.table.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:     reservations.filter(r => r.status !== 'cancelled').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    seated:    reservations.filter(r => r.status === 'seated').length,
    guests:    reservations.filter(r => r.status !== 'cancelled').reduce((s, r) => s + r.guests, 0),
  };

  const addReservation = (data: Partial<Reservation>) => {
    const newR: Reservation = {
      id: `R${String(reservations.length + 1).padStart(3, '0')}`,
      name: data.name || '',
      guests: data.guests || 2,
      time: data.time || '19:30',
      endTime: '21:00',
      table: data.table || 'T-02',
      status: 'confirmed',
      occasion: data.occasion || null,
      phone: data.phone || '',
    };
    setReservations(prev => [...prev, newR]);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Reservations</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">Today · Mon 23 June 2026</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-black/[0.04] rounded-xl p-1">
              {([['list', List], ['timeline', LayoutGrid]] as const).map(([k, Icon]) => (
                <button key={k} onClick={() => setView(k)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: view === k ? '#fff' : 'transparent',
                    color: view === k ? '#260B10' : 'rgba(26,26,26,0.4)',
                    boxShadow: view === k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <button onClick={() => setNewOpen(true)} className="btn-primary text-xs gap-1.5">
              <Plus size={13} /> New Reservation
            </button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Tonight',    value: stats.total,     icon: CalendarCheck, color: '#BF8B5E' },
            { label: 'Confirmed',        value: stats.confirmed, icon: CalendarCheck, color: '#10b981' },
            { label: 'Currently Seated', value: stats.seated,    icon: Users,         color: '#3b82f6' },
            { label: 'Expected Guests',  value: stats.guests,    icon: Users,         color: '#f59e0b' },
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

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div key="list"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="stat-card !p-0 overflow-hidden">

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.05]">
                <div className="relative flex-1 max-w-xs">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search guest or table…" className="input w-full pl-8 py-2 text-xs" />
                </div>
              </div>

              <div className="table-container">
                <table className="premium">
                  <thead>
                    <tr>
                      <th>Guest</th><th>Time</th><th>Table</th><th>Guests</th>
                      <th>Occasion</th><th>Status</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const cfg = STATUS_CFG[r.status];
                      return (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: cfg.dot + '15', color: cfg.dot }}>
                                <span className="font-body text-xs font-semibold">{r.name[0]}</span>
                              </div>
                              <div>
                                <p className="font-body text-sm text-charcoal/70">{r.name}</p>
                                <p className="font-body text-xs text-charcoal/30">{r.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 font-body text-sm text-charcoal/60">
                              <Clock size={12} style={{ color: '#BF8B5E' }} />{r.time}
                            </div>
                          </td>
                          <td>
                            <span className="font-body text-xs bg-black/[0.05] text-charcoal/60 px-2 py-1 rounded-lg">
                              {r.table}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 font-body text-xs text-charcoal/50">
                              <Users size={12} />{r.guests}
                            </div>
                          </td>
                          <td>
                            {r.occasion
                              ? <span className="font-body text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: 'rgba(191,139,94,0.1)', color: '#a67748' }}>
                                  {r.occasion}
                                </span>
                              : <span className="text-charcoal/20">—</span>}
                          </td>
                          <td>
                            <span className="font-body text-xs px-2.5 py-1 rounded-full border"
                              style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <button className="btn-icon w-7 h-7"><MoreHorizontal size={14} /></button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center font-body text-sm text-charcoal/30">No reservations found</div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Timeline view */
            <motion.div key="timeline"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="stat-card !p-0 overflow-hidden">

              <div className="px-5 py-4 border-b border-black/[0.05]">
                <p className="font-body text-sm font-medium text-charcoal/60">Timeline View — Today</p>
                <p className="font-body text-xs text-charcoal/30 mt-0.5">Tables as rows · 6 PM – 11 PM</p>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[700px] p-4">
                  {/* Time header */}
                  <div className="flex mb-2" style={{ paddingLeft: 60 }}>
                    {TIME_SLOTS.map(t => (
                      <div key={t} className="flex-1 font-body text-xs text-charcoal/30 text-center">
                        {t}
                      </div>
                    ))}
                  </div>

                  {/* Table rows */}
                  {TABLES_TL.map(tableId => {
                    const tableRes = reservations.filter(r => r.table === tableId && r.status !== 'cancelled');
                    return (
                      <div key={tableId} className="flex items-center mb-2 h-9">
                        <div className="w-14 flex-shrink-0 font-body text-xs font-medium text-charcoal/50">
                          {tableId}
                        </div>
                        <div className="flex-1 relative h-full bg-black/[0.02] rounded-lg overflow-hidden">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex">
                            {TIME_SLOTS.map((_, i) => (
                              <div key={i} className="flex-1 border-r border-black/[0.04] last:border-0" />
                            ))}
                          </div>
                          {/* Reservation blocks */}
                          {tableRes.map(r => {
                            const cfg   = STATUS_CFG[r.status];
                            const left  = timeToFraction(r.time) * 100;
                            const width = (timeToFraction(r.endTime) - timeToFraction(r.time)) * 100;
                            return (
                              <div key={r.id}
                                className="absolute top-1 bottom-1 rounded-md flex items-center px-2 overflow-hidden"
                                style={{
                                  left: `${left}%`, width: `${width}%`,
                                  backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
                                }}>
                                <span className="font-body text-xs truncate" style={{ color: cfg.text }}>
                                  {r.name.split(' ')[0]} · {r.guests}p
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-black/[0.05]">
                    {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }} />
                        <span className="font-body text-xs text-charcoal/40 capitalize">{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* New reservation modal */}
      <AnimatePresence>
        {newOpen && (
          <NewReservationModal onClose={() => setNewOpen(false)} onSave={addReservation} />
        )}
      </AnimatePresence>
    </div>
  );
}
