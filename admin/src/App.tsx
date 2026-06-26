import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// ─── Lazy pages ───────────────────────────────────────────────
const Overview       = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })));
const Orders         = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const Kitchen        = lazy(() => import('./pages/Kitchen').then(m => ({ default: m.Kitchen })));
const Reservations   = lazy(() => import('./pages/Reservations').then(m => ({ default: m.Reservations })));
const MenuManagement = lazy(() => import('./pages/MenuManagement').then(m => ({ default: m.MenuManagement })));
const Tables         = lazy(() => import('./pages/Tables').then(m => ({ default: m.Tables })));
const Inventory      = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Staff          = lazy(() => import('./pages/Staff').then(m => ({ default: m.Staff })));
const Customers      = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const Loyalty        = lazy(() => import('./pages/Loyalty').then(m => ({ default: m.Loyalty })));
const Analytics      = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Reviews        = lazy(() => import('./pages/Reviews').then(m => ({ default: m.Reviews })));
const Payments       = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const Settings       = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

// ─── Page loader ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(191,139,94,0.2)', borderTopColor: '#BF8B5E' }}
        />
        <span className="font-body text-xs text-charcoal/30">Loading…</span>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  // Ctrl/Cmd+K is handled inside DashboardLayout
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid rgba(0,0,0,0.08)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          },
        }}
      />
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><Overview /></Suspense>} />
          <Route path="orders"       element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
          <Route path="kitchen"      element={<Suspense fallback={<PageLoader />}><Kitchen /></Suspense>} />
          <Route path="reservations" element={<Suspense fallback={<PageLoader />}><Reservations /></Suspense>} />
          <Route path="menu"         element={<Suspense fallback={<PageLoader />}><MenuManagement /></Suspense>} />
          <Route path="tables"       element={<Suspense fallback={<PageLoader />}><Tables /></Suspense>} />
          <Route path="inventory"    element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
          <Route path="staff"        element={<Suspense fallback={<PageLoader />}><Staff /></Suspense>} />
          <Route path="customers"    element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
          <Route path="loyalty"      element={<Suspense fallback={<PageLoader />}><Loyalty /></Suspense>} />
          <Route path="analytics"    element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
          <Route path="reviews"      element={<Suspense fallback={<PageLoader />}><Reviews /></Suspense>} />
          <Route path="payments"     element={<Suspense fallback={<PageLoader />}><Payments /></Suspense>} />
          <Route path="settings"     element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
