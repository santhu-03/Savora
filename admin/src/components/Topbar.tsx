import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Command, X } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/kitchen': 'Kitchen Display',
  '/reservations': 'Reservations',
  '/menu': 'Menu Management',
  '/customers': 'Customers',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

const mockNotifications = [
  { id: 1, text: 'Table 7 order is ready to serve', time: '2m ago', unread: true },
  { id: 2, text: 'New reservation: 4 guests at 8:30 PM', time: '8m ago', unread: true },
  { id: 3, text: 'Low stock: Truffle oil running low', time: '22m ago', unread: false },
];

interface TopbarProps {
  onOpenCommand: () => void;
}

export function Topbar({ onOpenCommand }: TopbarProps) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Savora';
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <header className="h-14 flex items-center gap-4 px-5 border-b border-white/[0.05] flex-shrink-0">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-body text-sm font-medium text-off-white/80 truncate">{title}</h1>
      </div>

      {/* Search / Command trigger */}
      <button
        onClick={onOpenCommand}
        className="hidden md:flex items-center gap-2 bg-surface-2 border border-white/[0.06] rounded-xl
                   px-3.5 py-2 text-off-white/30 font-body text-xs
                   hover:border-white/10 hover:text-off-white/50 transition-all duration-150
                   w-48 cursor-pointer"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Search...</span>
        <span className="flex items-center gap-0.5 text-off-white/20">
          <Command size={10} />
          <span>K</span>
        </span>
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          className="btn-icon relative"
          onClick={() => setShowNotifications(o => !o)}
        >
          <Bell size={16} className="text-off-white/40" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" />
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-11 w-80 glass rounded-2xl shadow-glass border border-white/[0.06] z-40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                  <span className="font-body text-xs font-medium text-off-white/60">Notifications</span>
                  <button onClick={() => setShowNotifications(false)} className="btn-icon w-6 h-6">
                    <X size={12} />
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {mockNotifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-3">
                        {n.unread && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0 mt-1.5" />
                        )}
                        <div className={n.unread ? '' : 'pl-[18px]'}>
                          <p className="font-body text-xs text-off-white/70 leading-relaxed">{n.text}</p>
                          <p className="font-body text-2xs text-off-white/25 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-white/[0.05]">
                  <button className="font-body text-xs text-gold/60 hover:text-gold transition-colors">
                    Mark all as read
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-emerald-400/70">
        <div className="live-dot" />
        <span className="font-body text-2xs hidden sm:inline">Live</span>
      </div>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/30 to-accent/30 border border-gold/20 flex items-center justify-center cursor-pointer">
        <span className="font-body text-2xs text-gold font-semibold">A</span>
      </div>
    </header>
  );
}
