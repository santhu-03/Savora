import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, ChevronDown, LogOut, ClipboardList, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Restaurants', href: '/restaurants' },
  { label: 'Reserve', href: '/reservation' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const cartItems = useCart(state => state.items);
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const isHome = pathname === '/';
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        transparent
          ? 'bg-transparent'
          : 'bg-cream/95 backdrop-blur-md border-b border-gold/10 shadow-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className={cn(
            'font-heading text-2xl leading-none shrink-0 transition-colors duration-300',
            transparent ? 'text-cream' : 'text-primary'
          )}
        >
          Savora
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={cn(
                'px-4 py-2 text-sm font-body rounded-lg transition-colors duration-200',
                transparent
                  ? 'text-cream/70 hover:text-cream hover:bg-white/10'
                  : 'text-charcoal/60 hover:text-primary hover:bg-primary/5',
                pathname === href && (transparent ? 'text-cream' : 'text-primary font-medium')
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link
            to="/cart"
            className={cn(
              'relative p-2 rounded-lg transition-colors duration-200',
              transparent ? 'text-cream/70 hover:text-cream' : 'text-charcoal/60 hover:text-primary'
            )}
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {/* Auth */}
          {isAuthenticated && user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <span className={cn('text-sm font-body font-medium', transparent ? 'text-cream' : 'text-primary')}>
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={14} className={cn('transition-transform', userMenuOpen && 'rotate-180', transparent ? 'text-cream/60' : 'text-charcoal/40')} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-cream border border-gold/15 rounded-xl shadow-lg overflow-hidden"
                  >
                    {[
                      { icon: User, label: 'Profile', href: '/profile' },
                      { icon: ClipboardList, label: 'My Orders', href: '/profile?tab=orders' },
                      { icon: Heart, label: 'Loyalty', href: '/profile?tab=loyalty' },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link
                        key={label}
                        to={href}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-charcoal/70 hover:bg-primary/5 hover:text-primary transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Icon size={15} className="text-gold" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-gold/10">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-copper hover:bg-copper/5 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className={cn(
                  'px-4 py-2 text-sm font-body rounded-lg transition-colors',
                  transparent ? 'text-cream/70 hover:text-cream' : 'text-charcoal/60 hover:text-primary'
                )}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-body font-medium bg-primary text-cream rounded-lg hover:bg-primary-light transition-colors"
              >
                Join free
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              transparent ? 'text-cream/70 hover:text-cream' : 'text-charcoal/60 hover:text-primary'
            )}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream border-t border-gold/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  className="block px-4 py-3 text-sm font-body text-charcoal/70 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="block px-4 py-3 text-sm font-body text-charcoal/70 hover:text-primary hover:bg-primary/5 rounded-lg">
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-body text-copper hover:bg-copper/5 rounded-lg">
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 text-center py-2.5 text-sm border border-primary/20 text-primary rounded-lg">Sign in</Link>
                  <Link to="/register" className="flex-1 text-center py-2.5 text-sm bg-primary text-cream rounded-lg font-medium">Join free</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
