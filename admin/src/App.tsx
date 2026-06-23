import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { CommandPalette } from './components/CommandPalette';
import { Dashboard } from './pages/Dashboard';

// ─── Placeholder page ─────────────────────────────────────────
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-sm"
      >
        <div className="w-14 h-14 rounded-2xl bg-gold/[0.08] border border-gold/[0.12] flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">◈</span>
        </div>
        <h2 className="font-display text-3xl text-off-white mb-2">{title}</h2>
        <p className="font-body text-sm text-off-white/30 leading-relaxed">{description}</p>
        <button className="btn-primary mt-6 text-xs">Coming Soon</button>
      </motion.div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Ctrl/Cmd + K → command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(o => !o)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenCommand={() => setCommandOpen(true)} />

        {/* Page area */}
        <main className="flex-1 overflow-hidden relative">
          {/* Ambient background */}
          <div
            className="absolute top-0 right-0 w-[600px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at top right, rgba(200,155,60,0.04) 0%, transparent 70%)',
            }}
          />

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/orders"
                element={
                  <PlaceholderPage
                    title="Orders"
                    description="Full order management with live updates, kitchen routing, and payment processing."
                  />
                }
              />
              <Route
                path="/kitchen"
                element={
                  <PlaceholderPage
                    title="Kitchen Display"
                    description="Real-time kitchen queue with preparation timers and chef station assignments."
                  />
                }
              />
              <Route
                path="/reservations"
                element={
                  <PlaceholderPage
                    title="Reservations"
                    description="Interactive floor plan with live occupancy, timeline view, and automated reminders."
                  />
                }
              />
              <Route
                path="/menu"
                element={
                  <PlaceholderPage
                    title="Menu Management"
                    description="Manage dishes, pricing, availability, dietary tags, and seasonal specials."
                  />
                }
              />
              <Route
                path="/customers"
                element={
                  <PlaceholderPage
                    title="Customers"
                    description="Guest profiles, dining history, preferences, and loyalty tracking."
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <PlaceholderPage
                    title="Analytics"
                    description="Revenue trends, peak-hour heatmaps, inventory forecasting, and staff performance."
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="Restaurant profile, themes, integrations, and team permissions."
                  />
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
