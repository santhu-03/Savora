import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Star, Plus, Search, MoreHorizontal,
  X, Check, Mail, ShieldCheck,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Types ─────────────────────────────────────────────────────
type StaffRole = 'Head Chef' | 'Sous Chef' | 'Waiter' | 'Bartender' | 'Host' | 'Kitchen Porter' | 'Pastry Chef' | 'Manager';
interface StaffMember {
  id: number; name: string; email: string; role: StaffRole;
  department: string; shift: 'Morning' | 'Evening' | 'Night';
  status: 'on-duty' | 'off-duty' | 'break';
  rating: number; orders: number; joinedDate: string;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  'View Orders', 'Manage Orders', 'View Menu', 'Edit Menu',
  'View Inventory', 'Edit Inventory', 'View Reservations', 'Manage Reservations',
  'View Reports', 'Manage Staff', 'Access Settings',
];

const ROLE_COLORS: Record<string, string> = {
  'Head Chef': '#9333ea', 'Sous Chef': '#3b82f6', 'Waiter': '#10b981',
  'Bartender': '#f59e0b', 'Host': '#ec4899', 'Kitchen Porter': '#6b7280',
  'Pastry Chef': '#ef4444', 'Manager': '#BF8B5E',
};

const DEPT: Record<string, string> = {
  'Head Chef': 'Kitchen', 'Sous Chef': 'Kitchen', 'Pastry Chef': 'Kitchen', 'Kitchen Porter': 'Kitchen',
  'Waiter': 'Front of House', 'Host': 'Front of House', 'Bartender': 'Bar', 'Manager': 'Management',
};

const INITIAL_STAFF: StaffMember[] = [
  { id: 1, name: 'Ravi Kumar',     email: 'ravi.k@savora.in',     role: 'Head Chef',       department: 'Kitchen',        shift: 'Morning', status: 'on-duty',  rating: 4.9, orders: 42, joinedDate: 'Mar 2022', permissions: ['View Orders','Manage Orders','View Menu','Edit Menu','View Inventory','Edit Inventory'] },
  { id: 2, name: 'Sunita Rao',     email: 'sunita.r@savora.in',   role: 'Sous Chef',       department: 'Kitchen',        shift: 'Morning', status: 'on-duty',  rating: 4.7, orders: 38, joinedDate: 'Jun 2022', permissions: ['View Orders','Manage Orders','View Menu','View Inventory'] },
  { id: 3, name: 'Deepak Sharma',  email: 'deepak.s@savora.in',   role: 'Waiter',          department: 'Front of House', shift: 'Evening', status: 'off-duty', rating: 4.5, orders: 0,  joinedDate: 'Jan 2023', permissions: ['View Orders','View Menu','View Reservations'] },
  { id: 4, name: 'Pooja Nair',     email: 'pooja.n@savora.in',    role: 'Waiter',          department: 'Front of House', shift: 'Morning', status: 'on-duty',  rating: 4.8, orders: 18, joinedDate: 'Feb 2023', permissions: ['View Orders','Manage Orders','View Menu','View Reservations','Manage Reservations'] },
  { id: 5, name: 'Amit Singh',     email: 'amit.s@savora.in',     role: 'Bartender',       department: 'Bar',            shift: 'Evening', status: 'off-duty', rating: 4.6, orders: 0,  joinedDate: 'Apr 2023', permissions: ['View Orders','View Menu'] },
  { id: 6, name: 'Lakshmi Pillai', email: 'lakshmi.p@savora.in',  role: 'Host',            department: 'Front of House', shift: 'Morning', status: 'on-duty',  rating: 4.9, orders: 0,  joinedDate: 'Nov 2022', permissions: ['View Orders','View Reservations','Manage Reservations'] },
  { id: 7, name: 'Mohan Das',      email: 'mohan.d@savora.in',    role: 'Kitchen Porter',  department: 'Kitchen',        shift: 'Morning', status: 'break',    rating: 4.3, orders: 0,  joinedDate: 'Jul 2023', permissions: ['View Orders'] },
  { id: 8, name: 'Anita Gupta',    email: 'anita.g@savora.in',    role: 'Pastry Chef',     department: 'Kitchen',        shift: 'Morning', status: 'on-duty',  rating: 4.8, orders: 19, joinedDate: 'May 2023', permissions: ['View Orders','Manage Orders','View Menu','Edit Menu'] },
];

const STATUS_CFG = {
  'on-duty':  { label: 'On duty',  bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  'off-duty': { label: 'Off duty', bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' },
  'break':    { label: 'On break', bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' },
};

const ALL_ROLES: StaffRole[] = ['Head Chef', 'Sous Chef', 'Pastry Chef', 'Kitchen Porter', 'Waiter', 'Host', 'Bartender', 'Manager'];

// ─── Invite modal ───────────────────────────────────────────────
function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (data: Partial<StaffMember>) => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Waiter' as StaffRole, shift: 'Morning' as StaffMember['shift'] });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

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
          <h2 className="font-display text-xl text-charcoal">Invite Staff</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        <div className="space-y-3.5">
          <div>
            <label className="section-label block mb-1.5">Full Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Full name" className="input w-full" />
          </div>
          <div>
            <label className="section-label block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="name@savora.in" className="input w-full pl-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1.5">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input w-full">
                {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1.5">Shift</label>
              <select value={form.shift} onChange={e => set('shift', e.target.value)} className="input w-full">
                {['Morning', 'Evening', 'Night'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={() => { onInvite(form); onClose(); }} disabled={!form.name || !form.email}
            className="btn-primary flex-1 disabled:opacity-40">
            <Mail size={13} /> Send Invite
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Permissions drawer ─────────────────────────────────────────
function PermissionsDrawer({ member, onClose, onSave }: {
  member: StaffMember;
  onClose: () => void;
  onSave: (id: number, perms: string[]) => void;
}) {
  const [perms, setPerms] = useState<string[]>(member.permissions);
  const toggle = (p: string) =>
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white h-full w-full max-w-sm shadow-glass flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
          <div>
            <h2 className="font-display text-lg text-charcoal">Permissions</h2>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">{member.name} · {member.role}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        {/* Permissions list */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={14} style={{ color: '#BF8B5E' }} />
            <p className="font-body text-xs text-charcoal/50">Toggle access permissions for this staff member</p>
          </div>
          {ALL_PERMISSIONS.map(p => {
            const active = perms.includes(p);
            return (
              <button key={p} onClick={() => toggle(p)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150"
                style={{
                  backgroundColor: active ? 'rgba(191,139,94,0.04)' : 'transparent',
                  borderColor: active ? 'rgba(191,139,94,0.2)' : 'rgba(0,0,0,0.06)',
                }}>
                <span className="font-body text-sm text-charcoal/70">{p}</span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all
                  ${active ? 'bg-gold' : 'border border-black/[0.1]'}`}>
                  {active && <Check size={11} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/[0.06] flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={() => { onSave(member.id, perms); onClose(); }} className="btn-primary flex-1">
            Save Permissions
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Staff page ─────────────────────────────────────────────────
export function Staff() {
  const [staff, setStaff]     = useState<StaffMember[]>(INITIAL_STAFF);
  const [search, setSearch]   = useState('');
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [permsMember, setPermsMember] = useState<StaffMember | null>(null);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  const onDuty  = staff.filter(s => s.status === 'on-duty').length;
  const avgRating = (staff.reduce((s, m) => s + m.rating, 0) / staff.length).toFixed(1);

  const inviteMember = (data: Partial<StaffMember>) => {
    const newMember: StaffMember = {
      id: Math.max(...staff.map(s => s.id)) + 1,
      name: data.name ?? '',
      email: data.email ?? '',
      role: data.role ?? 'Waiter',
      department: DEPT[data.role ?? 'Waiter'] ?? 'Front of House',
      shift: data.shift ?? 'Morning',
      status: 'off-duty',
      rating: 0,
      orders: 0,
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      permissions: ['View Orders', 'View Menu'],
    };
    setStaff(prev => [...prev, newMember]);
  };

  const savePermissions = (id: number, perms: string[]) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, permissions: perms } : s));
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex items-center justify-between">
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Staff</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">
              {staff.length} members · {onDuty} on duty now
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex gap-2">
            <button className="btn-ghost text-xs">View Schedule</button>
            <button onClick={() => setInviteOpen(true)} className="btn-primary text-xs gap-1.5">
              <Plus size={13} /> Invite Staff
            </button>
          </motion.div>
        </motion.div>

        {/* KPIs */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Staff',  value: staff.length,              icon: Users, color: '#BF8B5E' },
            { label: 'On Duty',      value: onDuty,                    icon: Clock, color: '#10b981' },
            { label: 'Off Duty',     value: staff.length - onDuty,     icon: Clock, color: '#6b7280' },
            { label: 'Avg Rating',   value: avgRating,                 icon: Star,  color: '#f59e0b' },
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

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}>
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search staff…" className="input w-full pl-8 py-2 text-xs" />
          </div>
        </motion.div>

        {/* Staff cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((member, i) => {
            const color  = ROLE_COLORS[member.role] ?? '#BF8B5E';
            const scfg   = STATUS_CFG[member.status];
            return (
              <motion.div key={member.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="stat-card relative overflow-hidden">

                {/* Role color bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ backgroundColor: color }} />

                <div className="flex items-start justify-between mt-2">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-body text-sm font-bold"
                      style={{ background: `${color}15`, color }}>
                      {member.name.split(' ').map(p => p[0]).join('')}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: scfg.dot }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPermsMember(member)}
                      className="btn-icon w-7 h-7" title="Edit permissions">
                      <ShieldCheck size={13} />
                    </button>
                    <button className="btn-icon w-7 h-7"><MoreHorizontal size={14} /></button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="font-body text-sm font-semibold text-charcoal/80">{member.name}</p>
                  <p className="font-body text-xs mt-0.5" style={{ color }}>{member.role}</p>
                  <p className="font-body text-xs text-charcoal/35 mt-0.5">{member.department}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-body text-charcoal/40">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />{member.shift}
                  </div>
                  {member.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={11} style={{ color: '#f59e0b' }} />{member.rating}
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-black/[0.05] flex items-center justify-between">
                  <span className="font-body text-2xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: scfg.bg, color: scfg.text }}>
                    {scfg.label}
                  </span>
                  <span className="font-body text-2xs text-charcoal/30">
                    {member.permissions.length} perms
                  </span>
                </div>

                {/* Active shift indicator */}
                {member.status === 'on-duty' && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="live-dot" />
                    {member.orders > 0 && (
                      <span className="font-body text-2xs text-charcoal/40">{member.orders} orders today</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} onInvite={inviteMember} />}
        {permsMember && (
          <PermissionsDrawer member={permsMember} onClose={() => setPermsMember(null)} onSave={savePermissions} />
        )}
      </AnimatePresence>
    </div>
  );
}
