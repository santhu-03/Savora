import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

const Landing = lazy(() => import('@/pages/Landing'));
const Home = lazy(() => import('@/pages/Home'));
const Restaurants = lazy(() => import('@/pages/Restaurants'));
const RestaurantDetail = lazy(() => import('@/pages/RestaurantDetail'));
const QRMenu = lazy(() => import('@/pages/QRMenu'));
const Cart = lazy(() => import('@/pages/Cart'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const Reservation = lazy(() => import('@/pages/Reservation'));
const Profile = lazy(() => import('@/pages/Profile'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
      <p className="font-body text-charcoal/30 text-sm uppercase tracking-widest">404</p>
      <h1 className="font-heading text-5xl text-primary">Page not found</h1>
      <a href="/" className="mt-2 font-body text-sm text-gold hover:text-gold-dark transition-colors">
        ← Back to home
      </a>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/menu/:tableId" element={<QRMenu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/reservation" element={<Reservation />} />
          <Route path="/reservation/:restaurantId" element={<Reservation />} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
