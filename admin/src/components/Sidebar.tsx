import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, ChefHat, CalendarCheck,
  UtensilsCrossed, QrCode, Package, Users, UserCheck,
  Star, BarChart3, MessageSquare, CreditCard, Settings,
  ChevronLeft,
} from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';

// ─── Nav items ────────────────────────────────────────────────
interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview',         roles: ['admin', 'manager', 'staff'] },
  { to: '/orders',      icon: ShoppingBag,     label: 'Orders',           badge: '12', roles: ['admin', 'manager', 'staff'] },
  { to: '/kitchen',     icon: ChefHat,         label: 'Kitchen Display',  badge: '5',  roles: ['admin', 'manager', 'staff'] },
  { to: '/reservations',icon: CalendarCheck,   label: 'Reservations',     roles: ['admin', 'manager'] },
  { to: '/menu',        icon: UtensilsCrossed, label: 'Menu Management',  roles: ['admin', 'manager'] },
  { to: '/tables',      icon: QrCode,          label: 'Tables & QR',      roles: ['admin', 'manager'] },
  { to: '/inventory',   icon: Package,         label: 'Inventory',        roles: ['admin', 'manager'] },
  { to: '/staff',       icon: Users,           label: 'Staff',            roles: ['admin', 'manager'] },
  { to: '/customers',   icon: UserCheck,       label: 'Customers',        roles: ['admin', 'manager'] },
  { to: '/loyalty',     icon: Star,            label: 'Loyalty Program',  roles: ['admin', 'manager'] },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics',        roles: ['admin', 'manager'] },
  { to: '/reviews',     icon: MessageSquare,   label: 'Reviews',          roles: ['admin', 'manager'] },
  { to: '/payments',    icon: CreditCard,      label: 'Payments',         roles: ['admin', 'manager'] },
];

const BOTTOM_ITEMS: NavItem[] = [
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

// ─── Single nav link ──────────────────────────────────────────
function SidebarLink({
  item, collapsed, layoutId,
}: {
  item: NavItem;
  collapsed: boolean;
  layoutId: string;
}) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl transition-colors duration-150
         ${collapsed ? 'justify-center px-0 py-2.5 w-10 mx-auto' : 'px-3 py-2.5'}
         ${isActive
           ? 'text-white'
           : 'text-white/50 hover:text-white hover:bg-[#4a1720]'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: '#BF8B5E' }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
            />
          )}

          <item.icon size={16} className="relative flex-shrink-0" />

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="relative font-body text-sm whitespace-nowrap overflow-hidden flex-1"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {item.badge && !collapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative ml-auto font-body text-2xs bg-white/15 text-white/80 px-1.5 py-0.5 rounded-full leading-none"
            >
              {item.badge}
            </motion.span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle, mobile = false }: SidebarProps) {
  const { user } = useAuth();

  const visibleNav = NAV_ITEMS.filter(i => i.roles.includes(user.role));
  const visibleBottom = BOTTOM_ITEMS.filter(i => i.roles.includes(user.role));

  const initials = user.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.aside
      animate={{ width: mobile ? '100%' : collapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{ backgroundColor: '#260B10', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}
    >
      {/* ── Logo row ──────────────────────────────────── */}
      <div
        className="flex items-center justify-between h-14 px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="font-display text-xl text-gradient leading-none whitespace-nowrap">
                Savora
              </span>
              <span
                className="font-body text-2xs px-1.5 py-0.5 rounded-md leading-none"
                style={{ backgroundColor: 'rgba(191,139,94,0.15)', color: '#D9B89C' }}
              >
                Admin
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!mobile && (
          <button
            onClick={onToggle}
            className="btn-icon-dark flex-shrink-0"
            style={{ marginLeft: collapsed ? 'auto' : undefined }}
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft size={14} />
            </motion.div>
          </button>
        )}
      </div>

      {/* ── Nav items ─────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {visibleNav.map(item => (
          <SidebarLink
            key={item.to}
            item={item}
            collapsed={collapsed && !mobile}
            layoutId="activeNav"
          />
        ))}
      </nav>

      {/* ── Bottom: settings + user ────────────────────── */}
      <div
        className="px-2 pb-3 space-y-0.5 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}
      >
        {visibleBottom.map(item => (
          <SidebarLink
            key={item.to}
            item={item}
            collapsed={collapsed && !mobile}
            layoutId="activeNavBottom"
          />
        ))}

        {/* User row */}
        <div
          className={`flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl cursor-pointer
            hover:bg-[#4a1720] transition-colors duration-150
            ${collapsed && !mobile ? 'justify-center px-0' : ''}`}
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-body text-2xs font-semibold"
            style={{ background: 'linear-gradient(135deg,rgba(191,139,94,0.4),rgba(166,82,63,0.4))', color: '#D9B89C', border: '1px solid rgba(191,139,94,0.25)' }}
          >
            {initials}
          </div>

          <AnimatePresence>
            {(!collapsed || mobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden min-w-0"
              >
                <p className="font-body text-xs text-white/70 whitespace-nowrap truncate">{user.name}</p>
                <p className="font-body text-2xs whitespace-nowrap truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
