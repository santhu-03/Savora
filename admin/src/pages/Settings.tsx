import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Bell, Palette, Shield, Users, CreditCard, Globe,
  Clock, DollarSign, ChevronRight, Check, X, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: d } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Sections ──────────────────────────────────────────────────
const SECTIONS = [
  { id: 'general',       label: 'General',         icon: Store,       description: 'Restaurant name, logo, contact info' },
  { id: 'hours',         label: 'Opening Hours',   icon: Clock,       description: 'Per-day schedules and break times' },
  { id: 'pricing',       label: 'Pricing',         icon: DollarSign,  description: 'Tax, service charge, delivery fee' },
  { id: 'payment',       label: 'Payment',         icon: CreditCard,  description: 'Stripe integration, payout settings' },
  { id: 'notifications', label: 'Notifications',   icon: Bell,        description: 'Alerts, sounds, email digests' },
  { id: 'branding',      label: 'Branding',        icon: Palette,     description: 'Colors, fonts, logo — live preview' },
  { id: 'subscription',  label: 'Subscription',    icon: Globe,       description: 'Current plan, usage, upgrade options' },
  { id: 'security',      label: 'Security',        icon: Shield,      description: '2FA, sessions, audit log' },
  { id: 'team',          label: 'Team & Roles',    icon: Users,       description: 'Permissions, invitations, access' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ACCENT_PRESETS = [
  { color: '#BF8B5E', label: 'Savora Gold' },
  { color: '#3b82f6', label: 'Ocean Blue'  },
  { color: '#10b981', label: 'Emerald'     },
  { color: '#8b5cf6', label: 'Violet'      },
  { color: '#ef4444', label: 'Rose'        },
  { color: '#f59e0b', label: 'Amber'       },
];

const FONT_OPTIONS = [
  { value: 'Playfair Display', label: 'Playfair Display (current)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
  { value: 'Merriweather', label: 'Merriweather' },
];

const NOTIF_CHANNELS = ['Push', 'Email', 'SMS'];
const NOTIF_EVENTS = [
  'New Order Received', 'Order Ready to Serve', 'Payment Received',
  'Low Inventory Alert', 'New Reservation', 'Reservation Cancelled',
  'New Review Posted', 'Staff Clock-in',
];

// ─── Toggle switch ─────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex-shrink-0">
      {on
        ? <ToggleRight size={22} style={{ color: '#BF8B5E' }} />
        : <ToggleLeft  size={22} className="text-charcoal/25" />}
    </button>
  );
}

// ─── Settings page ──────────────────────────────────────────────
export function Settings() {
  const { user } = useAuth();
  const [active, setActive] = useState('general');

  // General
  const [restaurantName, setName]     = useState('Savora Bandra');
  const [tagline, setTagline]         = useState('Where Every Meal Is A Memory');
  const [cuisine, setCuisine]         = useState('Contemporary European');
  const [phone, setPhone]             = useState('+91 22 4567 8900');
  const [address, setAddress]         = useState('14 Hill Road, Bandra West, Mumbai 400050');

  // Opening hours
  const [hours, setHours] = useState(
    DAYS_OF_WEEK.map((day, i) => ({
      day, open: i < 6, from: '11:00', to: '23:00',
    }))
  );
  const toggleDay = (i: number) =>
    setHours(h => h.map((d, j) => j === i ? { ...d, open: !d.open } : d));
  const setHour = (i: number, key: 'from' | 'to', val: string) =>
    setHours(h => h.map((d, j) => j === i ? { ...d, [key]: val } : d));

  // Pricing
  const [taxRate, setTaxRate]             = useState('5');
  const [serviceCharge, setServiceCharge] = useState('10');
  const [deliveryFee, setDeliveryFee]     = useState('49');
  const [minOrder, setMinOrder]           = useState('500');

  // Notifications
  const [notifState, setNotifState] = useState<Record<string, Record<string, boolean>>>(
    Object.fromEntries(
      NOTIF_EVENTS.map(e => [e, Object.fromEntries(NOTIF_CHANNELS.map(c => [c, c === 'Push']))])
    )
  );
  const toggleNotif = (event: string, channel: string) =>
    setNotifState(prev => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));

  // Branding
  const [accent, setAccent] = useState('#BF8B5E');
  const [font, setFont]     = useState('Playfair Display');

  const section = SECTIONS.find(s => s.id === active);

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-[1400px] space-y-5">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp}>
            <h1 className="font-display text-2xl text-charcoal">Settings</h1>
            <p className="font-body text-xs text-charcoal/40 mt-0.5">Manage your restaurant configuration</p>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-4">

          {/* Sidebar nav */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card !p-2 space-y-0.5 lg:col-span-1 h-fit">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={{
                  backgroundColor: active === s.id ? 'rgba(38,11,16,0.06)' : 'transparent',
                  color: active === s.id ? '#260B10' : 'rgba(26,26,26,0.5)',
                }}>
                <s.icon size={15} className="flex-shrink-0" />
                <span className="font-body text-sm">{s.label}</span>
                {active === s.id && <ChevronRight size={12} className="ml-auto opacity-40" />}
              </button>
            ))}
          </motion.div>

          {/* Content panel */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card lg:col-span-3">

            <h2 className="font-display text-xl text-charcoal mb-0.5">{section?.label}</h2>
            <p className="font-body text-xs text-charcoal/40 mb-6">{section?.description}</p>

            <AnimatePresence mode="wait">
              <motion.div key={active}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}>

                {/* ── General ───────────────────────────────────── */}
                {active === 'general' && (
                  <div className="space-y-4 max-w-lg">
                    {[
                      { label: 'Restaurant Name', val: restaurantName, set: setName, placeholder: 'Savora Bandra' },
                      { label: 'Tagline',         val: tagline,         set: setTagline,  placeholder: 'Your tagline…' },
                      { label: 'Phone',           val: phone,           set: setPhone,    placeholder: '+91 …' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="section-label block mb-1.5">{f.label}</label>
                        <input value={f.val} onChange={e => f.set(e.target.value)}
                          placeholder={f.placeholder} className="input w-full" />
                      </div>
                    ))}
                    <div>
                      <label className="section-label block mb-1.5">Cuisine Type</label>
                      <select value={cuisine} onChange={e => setCuisine(e.target.value)} className="input w-full">
                        {['Contemporary European','Indian Fine Dining','Pan-Asian','Mediterranean','Modern Indian'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="section-label block mb-1.5">Address</label>
                      <textarea value={address} onChange={e => setAddress(e.target.value)}
                        rows={2} className="input w-full resize-none" />
                    </div>
                    <div className="pt-2">
                      <button className="btn-primary"><Check size={14} /> Save Changes</button>
                    </div>
                  </div>
                )}

                {/* ── Opening hours ──────────────────────────────── */}
                {active === 'hours' && (
                  <div className="space-y-3 max-w-lg">
                    {hours.map((h, i) => (
                      <div key={h.day} className="flex items-center gap-4 py-2 border-b border-black/[0.05] last:border-0">
                        <div className="w-24 flex-shrink-0">
                          <Toggle on={h.open} onChange={() => toggleDay(i)} />
                        </div>
                        <span className="font-body text-sm text-charcoal/70 w-24 flex-shrink-0">{h.day}</span>
                        {h.open ? (
                          <div className="flex items-center gap-2">
                            <input type="time" value={h.from}
                              onChange={e => setHour(i, 'from', e.target.value)}
                              className="input py-1.5 text-xs w-28" />
                            <span className="font-body text-xs text-charcoal/40">to</span>
                            <input type="time" value={h.to}
                              onChange={e => setHour(i, 'to', e.target.value)}
                              className="input py-1.5 text-xs w-28" />
                          </div>
                        ) : (
                          <span className="font-body text-sm text-charcoal/30">Closed</span>
                        )}
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="btn-primary"><Check size={14} /> Save Hours</button>
                    </div>
                  </div>
                )}

                {/* ── Pricing ────────────────────────────────────── */}
                {active === 'pricing' && (
                  <div className="space-y-4 max-w-sm">
                    {[
                      { label: 'GST Rate (%)',        val: taxRate,       set: setTaxRate,        suffix: '%' },
                      { label: 'Service Charge (%)', val: serviceCharge, set: setServiceCharge,  suffix: '%' },
                      { label: 'Delivery Fee (₹)',   val: deliveryFee,   set: setDeliveryFee,    suffix: '₹' },
                      { label: 'Min. Order (₹)',     val: minOrder,       set: setMinOrder,       suffix: '₹' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="section-label block mb-1.5">{f.label}</label>
                        <div className="relative">
                          <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                            className="input w-full pr-10" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-charcoal/30">
                            {f.suffix}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Preview */}
                    <div className="bg-black/[0.025] rounded-xl p-4 border border-black/[0.05] mt-2">
                      <p className="section-label mb-3">Example Bill Preview</p>
                      {[
                        { label: 'Subtotal',       value: '₹2,000' },
                        { label: `GST (${taxRate}%)`, value: `₹${Math.round(2000 * Number(taxRate) / 100)}` },
                        { label: `Service (${serviceCharge}%)`, value: `₹${Math.round(2000 * Number(serviceCharge) / 100)}` },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between font-body text-xs text-charcoal/60 mb-1.5">
                          <span>{row.label}</span><span>{row.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-body text-sm font-semibold text-charcoal/80 pt-2 border-t border-black/[0.06] mt-1">
                        <span>Total</span>
                        <span>₹{(2000 * (1 + Number(taxRate)/100 + Number(serviceCharge)/100)).toFixed(0)}</span>
                      </div>
                    </div>

                    <button className="btn-primary"><Check size={14} /> Save Pricing</button>
                  </div>
                )}

                {/* ── Payment ────────────────────────────────────── */}
                {active === 'payment' && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-br from-[#635BFF]/10 to-[#0a2540]/5 rounded-2xl p-6 border border-[#635BFF]/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#635BFF] flex items-center justify-center">
                          <CreditCard size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="font-body text-sm font-semibold text-charcoal/80">Stripe Payments</p>
                          <p className="font-body text-xs text-charcoal/45">Accept cards, UPI, net banking</p>
                        </div>
                        <span className="ml-auto font-body text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Not connected
                        </span>
                      </div>
                      <button className="w-full py-2.5 rounded-xl font-body text-sm font-semibold text-white transition-all active:scale-[0.97]"
                        style={{ backgroundColor: '#635BFF' }}>
                        Connect with Stripe
                      </button>
                    </div>

                    <div className="bg-black/[0.025] rounded-xl p-4 border border-black/[0.05]">
                      <p className="section-label mb-3">Cash Payments</p>
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm text-charcoal/70">Accept cash on delivery</span>
                        <Toggle on={true} onChange={() => {}} />
                      </div>
                    </div>

                    <div className="bg-black/[0.025] rounded-xl p-4 border border-black/[0.05]">
                      <p className="section-label mb-3">Payout Schedule</p>
                      <select className="input w-full max-w-xs">
                        <option>Daily (T+2)</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── Notifications ──────────────────────────────── */}
                {active === 'notifications' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 mb-1">
                      <div className="font-body text-xs text-charcoal/40 col-span-1">Event</div>
                      {NOTIF_CHANNELS.map(c => (
                        <div key={c} className="font-body text-xs text-charcoal/40 text-center">{c}</div>
                      ))}
                    </div>
                    {NOTIF_EVENTS.map(event => (
                      <div key={event} className="grid grid-cols-4 gap-2 items-center py-2.5 border-b border-black/[0.04] last:border-0">
                        <span className="font-body text-sm text-charcoal/65 col-span-1">{event}</span>
                        {NOTIF_CHANNELS.map(ch => (
                          <div key={ch} className="flex justify-center">
                            <button onClick={() => toggleNotif(event, ch)}
                              className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center
                                ${notifState[event][ch] ? 'bg-gold border-gold' : 'border-black/[0.12] hover:border-gold/40'}`}>
                              {notifState[event][ch] && <Check size={11} className="text-white" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="pt-2">
                      <button className="btn-primary"><Check size={14} /> Save Preferences</button>
                    </div>
                  </div>
                )}

                {/* ── Branding ───────────────────────────────────── */}
                {active === 'branding' && (
                  <div className="space-y-6 max-w-lg">
                    {/* Accent color */}
                    <div>
                      <label className="section-label block mb-3">Accent Color</label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {ACCENT_PRESETS.map(p => (
                          <button key={p.color} onClick={() => setAccent(p.color)}
                            className="flex flex-col items-center gap-1.5 group">
                            <div className="w-8 h-8 rounded-xl transition-all duration-150 group-hover:scale-110"
                              style={{
                                backgroundColor: p.color,
                                outline: accent === p.color ? `2px solid ${p.color}` : 'none',
                                outlineOffset: 2,
                              }} />
                            <span className="font-body text-2xs text-charcoal/40 whitespace-nowrap">{p.label}</span>
                          </button>
                        ))}
                        <div className="flex flex-col items-center gap-1.5">
                          <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
                            className="w-8 h-8 rounded-xl border-0 cursor-pointer p-0" />
                          <span className="font-body text-2xs text-charcoal/40">Custom</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: accent }} />
                        <span className="font-mono text-xs text-charcoal/50">{accent.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Font */}
                    <div>
                      <label className="section-label block mb-2">Display Font</label>
                      <select value={font} onChange={e => setFont(e.target.value)} className="input w-full max-w-xs">
                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>

                    {/* Live preview */}
                    <div>
                      <label className="section-label block mb-2">Live Preview</label>
                      <div className="rounded-2xl border border-black/[0.08] overflow-hidden">
                        <div className="p-4" style={{ backgroundColor: accent + '12' }}>
                          <h3 className="text-xl leading-none mb-1" style={{ fontFamily: `'${font}', serif`, color: accent }}>
                            Savora Bandra
                          </h3>
                          <p className="font-body text-xs text-charcoal/50">Where Every Meal Is A Memory</p>
                        </div>
                        <div className="p-4 flex items-center gap-3">
                          <button className="font-body text-sm px-4 py-2 rounded-xl text-white"
                            style={{ backgroundColor: accent }}>Book Table</button>
                          <span className="font-body text-sm px-4 py-2 rounded-xl border"
                            style={{ borderColor: accent, color: accent }}>View Menu</span>
                        </div>
                      </div>
                    </div>

                    <button className="btn-primary"><Check size={14} /> Save Branding</button>
                  </div>
                )}

                {/* ── Subscription ───────────────────────────────── */}
                {active === 'subscription' && (
                  <div className="space-y-4">
                    {/* Current plan */}
                    <div className="rounded-2xl border-2 p-5" style={{ borderColor: '#BF8B5E', backgroundColor: 'rgba(191,139,94,0.04)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-body text-xs text-charcoal/40 mb-1">Current Plan</p>
                          <h3 className="font-display text-2xl text-charcoal">Pro</h3>
                          <p className="font-body text-xs text-charcoal/50 mt-1">₹4,999 / month · Billed monthly</p>
                        </div>
                        <span className="badge badge-confirmed">Active</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-black/[0.06]">
                        {['Unlimited Orders', 'Real-time KDS', 'Analytics', '5 Staff Members'].map(f => (
                          <div key={f} className="flex items-center gap-2 font-body text-xs text-charcoal/60">
                            <Check size={12} style={{ color: '#BF8B5E' }} />{f}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upgrade plan */}
                    <div className="rounded-2xl border border-black/[0.08] p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-body text-xs text-charcoal/40 mb-1">Upgrade to</p>
                          <h3 className="font-display text-2xl text-charcoal">Enterprise</h3>
                          <p className="font-body text-xs text-charcoal/50 mt-1">₹12,999 / month</p>
                        </div>
                        <span className="font-body text-2xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: '#BF8B5E' }}>Popular</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {['Multi-location', 'Unlimited Staff', 'Custom Integrations', 'White Label', 'Priority Support', 'Advanced Analytics'].map(f => (
                          <div key={f} className="flex items-center gap-2 font-body text-xs text-charcoal/60">
                            <Check size={11} style={{ color: '#10b981' }} />{f}
                          </div>
                        ))}
                      </div>
                      <button className="btn-gold w-full">Upgrade to Enterprise</button>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] p-4">
                      <p className="section-label mb-2">Billing Cycle</p>
                      <p className="font-body text-sm text-charcoal/60">Next billing: <span className="font-semibold text-charcoal">July 23, 2026</span></p>
                      <div className="flex gap-2 mt-3">
                        <button className="btn-ghost text-xs">Download Invoice</button>
                        <button className="btn-ghost text-xs text-red-500">Cancel Plan</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Team ───────────────────────────────────────── */}
                {active === 'team' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-body text-sm text-charcoal/60">Team members with admin access</p>
                      <button className="btn-primary text-xs">Invite Member</button>
                    </div>
                    {[
                      { name: user.name, email: user.email, role: 'Admin', you: true },
                      { name: 'Ravi Kumar',  email: 'ravi.k@savora.in',  role: 'Manager', you: false },
                      { name: 'Pooja Nair',  email: 'pooja.n@savora.in', role: 'Staff',   you: false },
                    ].map(m => (
                      <div key={m.email}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-body text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(191,139,94,0.1)', color: '#a67748' }}>
                            {m.name.split(' ').map(p => p[0]).join('')}
                          </div>
                          <div>
                            <p className="font-body text-sm font-medium text-charcoal/80">
                              {m.name} {m.you && <span className="font-body text-2xs text-charcoal/30">(you)</span>}
                            </p>
                            <p className="font-body text-xs text-charcoal/35">{m.email}</p>
                          </div>
                        </div>
                        <span className="font-body text-xs px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: 'rgba(38,11,16,0.06)', color: '#260B10' }}>
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Security ───────────────────────────────────── */}
                {active === 'security' && (
                  <div className="space-y-4 max-w-md">
                    {[
                      { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', enabled: false },
                      { label: 'Login Notifications',       desc: 'Get notified when someone logs in from a new device', enabled: true },
                      { label: 'Session Timeout',           desc: 'Automatically log out after 8 hours of inactivity', enabled: true },
                    ].map(item => (
                      <div key={item.label} className="flex items-start justify-between p-4 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                        <div className="flex-1 pr-4">
                          <p className="font-body text-sm font-medium text-charcoal/70">{item.label}</p>
                          <p className="font-body text-xs text-charcoal/40 mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle on={item.enabled} onChange={() => {}} />
                      </div>
                    ))}
                    <button className="btn-ghost text-xs text-red-500">
                      <X size={13} /> Revoke All Sessions
                    </button>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
