import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}
