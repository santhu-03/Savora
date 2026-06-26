import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Command, Search, ChevronRight, ChevronDown,
  Menu, Check, LogOut, UserCog, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Route map ────────────────────────────────────────────────
const ROUTE_META: Record<string, { label: string; parent?: string }> = {
  '/':             { label: 'Overview' },
  '/orders':       { label: 'Orders' },
  '/kitchen':      { label: 'Kitchen Display' },
  '/reservations': { label: 'Reservations' },
  '/menu':         { label: 'Menu Management' },
  '/tables':       { label: 'Tables & QR' },
  '/inventory':    { label: 'Inventory' },
  '/staff':        { label: 'Staff' },
  '/customers':    { label: 'Customers' },
  '/loyalty':      { label: 'Loyalty Program' },
  '/analytics':    { label: 'Analytics' },
  '/reviews':      { label: 'Reviews' },
  '/payments':     { label: 'Payments' },
  '/settings':     { label: 'Settings' },
};

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Table 7 order is ready to serve', time: '2m ago', unread: true },
  { id: 2, text: 'New reservation: 4 guests at 8:30 PM', time: '8m ago', unread: true },
  { id: 3, text: 'Low stock: Truffle oil running low', time: '22m ago', unread: false },
  { id: 4, text: 'New 5-star review from Priya S.', time: '1h ago', unread: false },
];

interface TopbarProps {
  onOpenCommand: () => void;
  onMobileMenu: () => void;
}

export function Topbar({ onOpenCommand, onMobileMenu }: TopbarProps) {
  const location = useLocation();
  const { user, setRole, restaurants, activeRestaurant, setActiveRestaurant } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRestaurant, setShowRestaurant] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const meta = ROUTE_META[location.pathname] ?? { label: 'Savora' };
  const unreadCount = notifications.filter(n => n.unread).length;

  const initials = user.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const markAllRead = () =>
    setNotifications(n => n.map(x => ({ ...x, unread: false })));

  return (
    <header
      className="h-14 flex items-center gap-3 px-4 flex-shrink-0 relative z-30"
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Mobile menu toggle */}
      <button className="btn-icon md:hidden" onClick={onMobileMenu}>
        <Menu size={18} className="text-charcoal/50" />
      </button>

      {/* ── Breadcrumb ────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        <Link
          to="/"
          className="font-body text-xs text-charcoal/35 hover:text-charcoal/60 transition-colors whitespace-nowrap"
        >
          Savora
        </Link>
        <ChevronRight size={12} className="text-charcoal/20 flex-shrink-0" />
        <span className="font-body text-sm font-medium text-charcoal truncate">
          {meta.label}
        </span>
      </nav>

      {/* ── Restaurant selector ───────────────────────── */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => { setShowRestaurant(o => !o); setShowProfile(false); setShowNotifications(false); }}
          className="flex items-center gap-2 font-body text-xs text-charcoal/60 hover:text-charcoal
                     bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.06]
                     rounded-xl px-3 py-2 transition-all duration-150"
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#BF8B5E' }}
          />
          <span className="max-w-[140px] truncate">{activeRestaurant}</span>
          <ChevronDown size={12} className="flex-shrink-0" />
        </button>

        <AnimatePresence>
          {showRestaurant && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowRestaurant(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-card-hover border border-black/[0.06] z-40 overflow-hidden py-1"
              >
                {restaurants.map(r => (
                  <button
                    key={r}
                    onClick={() => { setActiveRestaurant(r); setShowRestaurant(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left
                               font-body text-sm text-charcoal/70 hover:bg-black/[0.03] transition-colors"
                  >
                    {r}
                    {r === activeRestaurant && (
                      <Check size={13} style={{ color: '#BF8B5E' }} />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search / command trigger ──────────────────── */}
      <button
        onClick={onOpenCommand}
        className="hidden md:flex items-center gap-2 bg-black/[0.04] border border-black/[0.06]
                   rounded-xl px-3.5 py-2 text-charcoal/35 font-body text-xs
                   hover:border-black/10 hover:text-charcoal/50 transition-all duration-150 w-44"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Search…</span>
        <span className="flex items-center gap-0.5 text-charcoal/20">
          <Command size={10} />
          <span>K</span>
        </span>
      </button>

      {/* ── Notifications ─────────────────────────────── */}
      <div className="relative">
        <button
          className="btn-icon relative"
          onClick={() => { setShowNotifications(o => !o); setShowProfile(false); setShowRestaurant(false); }}
        >
          <Bell size={16} className="text-charcoal/40" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#BF8B5E' }}
            />
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-card-hover border border-black/[0.06] z-40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
                  <span className="font-body text-xs font-semibold text-charcoal/60">
                    Notifications
                    {unreadCount > 0 && (
                      <span
                        className="ml-2 font-body text-2xs px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(191,139,94,0.12)', color: '#BF8B5E' }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="btn-icon w-6 h-6">
                    <X size={12} />
                  </button>
                </div>

                <div className="divide-y divide-black/[0.04] max-h-72 overflow-y-auto no-scrollbar">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 hover:bg-black/[0.02] transition-colors
                        ${n.unread ? 'bg-[rgba(191,139,94,0.04)]' : ''}`}
                    >
                      <div className="flex gap-3">
                        {n.unread && (
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{ backgroundColor: '#BF8B5E' }}
                          />
                        )}
                        <div className={n.unread ? '' : 'pl-[18px]'}>
                          <p className="font-body text-xs text-charcoal/70 leading-relaxed">{n.text}</p>
                          <p className="font-body text-2xs text-charcoal/30 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2.5 border-t border-black/[0.05]">
                  <button
                    onClick={markAllRead}
                    className="font-body text-xs transition-colors"
                    style={{ color: 'rgba(191,139,94,0.7)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#BF8B5E')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(191,139,94,0.7)')}
                  >
                    Mark all as read
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Profile dropdown ──────────────────────────── */}
      <div className="relative">
        <button
          onClick={() => { setShowProfile(o => !o); setShowNotifications(false); setShowRestaurant(false); }}
          className="flex items-center gap-2 hover:bg-black/[0.04] rounded-xl px-2 py-1.5 transition-colors duration-150"
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-body text-2xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, #260B10, #BF8B5E)',
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <ChevronDown size={12} className="text-charcoal/30 hidden sm:block" />
        </button>

        <AnimatePresence>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfile(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-card-hover border border-black/[0.06] z-40 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-4 border-b border-black/[0.05]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-body text-sm font-semibold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #260B10, #BF8B5E)', color: '#fff' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-charcoal truncate">{user.name}</p>
                      <p className="font-body text-xs text-charcoal/40 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {(['admin', 'manager', 'staff'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className="font-body text-2xs px-2 py-1 rounded-lg transition-all duration-150 capitalize"
                        style={{
                          backgroundColor: user.role === r ? '#260B10' : 'rgba(0,0,0,0.04)',
                          color: user.role === r ? '#fff' : 'rgba(26,26,26,0.4)',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 font-body text-sm text-charcoal/60 hover:bg-black/[0.03] hover:text-charcoal transition-colors text-left">
                    <UserCog size={14} className="flex-shrink-0" />
                    Account Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 font-body text-sm text-red-500/70 hover:bg-red-50 hover:text-red-600 transition-colors text-left">
                    <LogOut size={14} className="flex-shrink-0" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
