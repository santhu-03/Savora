import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarCheck,
  UtensilsCrossed,
  Users,
  BarChart3,
  ChefHat,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/orders', icon: ShoppingBag, label: 'Orders', badge: '12' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen', badge: '5' },
  { to: '/reservations', icon: CalendarCheck, label: 'Reservations' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const bottomItems = [{ to: '/settings', icon: Settings, label: 'Settings' }];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex-shrink-0 flex flex-col h-screen glass border-r border-white/[0.05] z-20 overflow-hidden"
    >
      {/* Logo row */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.05]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="font-display text-xl text-gradient leading-none whitespace-nowrap"
            >
              Savora
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="btn-icon flex-shrink-0 text-off-white/25 hover:text-gold"
          style={{ marginLeft: collapsed ? 'auto' : undefined }}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronLeft size={14} />
          </motion.div>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, label, badge, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {/* Sliding active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gold/[0.08] rounded-xl border border-gold/[0.12]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}

                <Icon
                  size={16}
                  className={`relative flex-shrink-0 transition-colors ${isActive ? 'text-gold' : ''}`}
                />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative font-body text-sm whitespace-nowrap overflow-hidden flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {badge && !collapsed && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative ml-auto font-body text-2xs bg-gold/15 text-gold px-1.5 py-0.5 rounded-full leading-none"
                  >
                    {badge}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom items + user */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-white/[0.05] pt-2">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNavBottom"
                    className="absolute inset-0 bg-gold/[0.08] rounded-xl border border-gold/[0.12]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon size={16} className="relative flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative font-body text-sm whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}

        {/* User */}
        <div className={`flex items-center gap-3 px-3 py-2.5 mt-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/30 to-accent/30 border border-gold/20 flex-shrink-0 flex items-center justify-center">
            <span className="font-body text-2xs text-gold font-semibold">A</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="font-body text-xs text-off-white/60 whitespace-nowrap">Admin User</p>
                <p className="font-body text-2xs text-off-white/25 whitespace-nowrap">admin@savora.in</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
