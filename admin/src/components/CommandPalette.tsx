import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, ShoppingBag, CalendarCheck,
  UtensilsCrossed, Users, BarChart3, ChefHat, Settings,
  Plus, QrCode, Package, UserCheck, Star, MessageSquare,
  CreditCard, ArrowRight, X,
} from 'lucide-react';

interface Command {
  id: string;
  group: 'Navigate' | 'Actions';
  label: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  shortcut?: string[];
}

const COMMANDS: Command[] = [
  { id: 'overview',     group: 'Navigate', label: 'Overview',        icon: LayoutDashboard, href: '/',             shortcut: ['G', 'D'] },
  { id: 'orders',       group: 'Navigate', label: 'Orders',          icon: ShoppingBag,     href: '/orders',        shortcut: ['G', 'O'] },
  { id: 'kitchen',      group: 'Navigate', label: 'Kitchen Display', icon: ChefHat,         href: '/kitchen' },
  { id: 'reservations', group: 'Navigate', label: 'Reservations',    icon: CalendarCheck,   href: '/reservations',  shortcut: ['G', 'R'] },
  { id: 'menu',         group: 'Navigate', label: 'Menu Management', icon: UtensilsCrossed, href: '/menu' },
  { id: 'tables',       group: 'Navigate', label: 'Tables & QR',     icon: QrCode,          href: '/tables' },
  { id: 'inventory',    group: 'Navigate', label: 'Inventory',       icon: Package,         href: '/inventory' },
  { id: 'staff',        group: 'Navigate', label: 'Staff',           icon: Users,           href: '/staff' },
  { id: 'customers',    group: 'Navigate', label: 'Customers',       icon: UserCheck,       href: '/customers' },
  { id: 'loyalty',      group: 'Navigate', label: 'Loyalty Program', icon: Star,            href: '/loyalty' },
  { id: 'analytics',    group: 'Navigate', label: 'Analytics',       icon: BarChart3,       href: '/analytics' },
  { id: 'reviews',      group: 'Navigate', label: 'Reviews',         icon: MessageSquare,   href: '/reviews' },
  { id: 'payments',     group: 'Navigate', label: 'Payments',        icon: CreditCard,      href: '/payments' },
  { id: 'settings',     group: 'Navigate', label: 'Settings',        icon: Settings,        href: '/settings' },
  { id: 'new-order',        group: 'Actions', label: 'New Order',       description: 'Create a walk-in order',      icon: Plus },
  { id: 'new-reservation',  group: 'Actions', label: 'New Reservation', description: 'Add a table reservation',     icon: CalendarCheck },
  { id: 'add-menu-item',    group: 'Actions', label: 'Add Menu Item',   description: 'Add a new dish to the menu',  icon: UtensilsCrossed },
];

const GROUPS: Command['group'][] = ['Navigate', 'Actions'];

interface Props { open: boolean; onClose: () => void; }

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.description?.toLowerCase().includes(query.toLowerCase())
  );

  const execute = useCallback((cmd: Command) => {
    if (cmd.href) navigate(cmd.href);
    onClose(); setQuery(''); setActiveIndex(0);
  }, [navigate, onClose]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setActiveIndex(0); }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && filtered[activeIndex]) execute(filtered[activeIndex]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, activeIndex, execute, onClose]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  const grouped = GROUPS
    .map(group => ({ group, items: filtered.filter(c => c.group === group) }))
    .filter(g => g.items.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-start justify-center pt-[18vh] z-50 px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-card-hover border border-black/[0.08] overflow-hidden pointer-events-auto"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.06]">
                <Search size={16} className="text-charcoal/30 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands, pages…"
                  className="flex-1 bg-transparent font-body text-sm text-charcoal placeholder-charcoal/25 outline-none"
                />
                <button onClick={onClose} className="btn-icon w-7 h-7 text-charcoal/25">
                  <X size={14} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto no-scrollbar py-2">
                {grouped.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="font-body text-charcoal/25 text-sm">No results for "{query}"</p>
                  </div>
                ) : grouped.map(({ group, items }) => (
                  <div key={group}>
                    <p className="px-4 py-1.5 font-body text-2xs text-charcoal/25 uppercase tracking-widest">
                      {group}
                    </p>
                    {items.map(cmd => {
                      const globalIndex = filtered.indexOf(cmd);
                      const isActive = globalIndex === activeIndex;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => execute(cmd)}
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75
                            ${isActive ? 'bg-black/[0.03]' : 'hover:bg-black/[0.02]'}`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                            style={{
                              backgroundColor: isActive ? 'rgba(191,139,94,0.12)' : 'rgba(0,0,0,0.04)',
                              color: isActive ? '#BF8B5E' : 'rgba(26,26,26,0.35)',
                            }}
                          >
                            <cmd.icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-body text-sm transition-colors ${isActive ? 'text-charcoal' : 'text-charcoal/60'}`}>
                              {cmd.label}
                            </p>
                            {cmd.description && (
                              <p className="font-body text-xs text-charcoal/30 truncate">{cmd.description}</p>
                            )}
                          </div>
                          {cmd.shortcut && (
                            <div className="flex items-center gap-1">
                              {cmd.shortcut.map((k, i) => (
                                <span key={i}
                                  className="font-body text-2xs bg-black/[0.06] text-charcoal/30 px-1.5 py-0.5 rounded">
                                  {k}
                                </span>
                              ))}
                            </div>
                          )}
                          {isActive && <ArrowRight size={13} style={{ color: '#BF8B5E', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-black/[0.05] flex items-center gap-4">
                {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
                  <span key={label} className="flex items-center gap-1.5 font-body text-2xs text-charcoal/20">
                    <kbd className="bg-black/[0.05] px-1.5 py-0.5 rounded text-charcoal/30">{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
