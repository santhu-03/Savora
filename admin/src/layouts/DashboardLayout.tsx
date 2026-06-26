import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { CommandPalette } from '../components/CommandPalette';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Ctrl/Cmd + K → command palette
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(o => !o)}
        />
      </div>

      {/* ── Mobile drawer ───────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
              style={{ maxHeight: '85vh' }}
            >
              {/* Handle */}
              <div className="flex justify-center py-2" style={{ backgroundColor: '#260B10' }}>
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="relative overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(85vh - 32px)' }}>
                <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} mobile />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onOpenCommand={() => setCommandOpen(true)}
          onMobileMenu={() => setMobileOpen(true)}
        />

        {/* Ambient glow */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-cream relative">
          <div
            className="pointer-events-none absolute top-0 right-0 w-[500px] h-[300px]"
            style={{
              background: 'radial-gradient(ellipse at top right, rgba(191,139,94,0.06) 0%, transparent 70%)',
            }}
          />
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>

      {/* ── Command Palette ─────────────────────────────── */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
