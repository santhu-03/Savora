import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import api, { tokenStorage } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  loyaltyTier?: string;
  isVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const setUser = (user: AuthUser | null) =>
    setState({ user, isAuthenticated: !!user, isLoading: false });

  // Hydrate from stored token on mount
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    api
      .get<{ data: AuthUser }>('/auth/me')
      .then(res => setUser(res.data.data))
      .catch(() => {
        tokenStorage.clear();
        setState(s => ({ ...s, isLoading: false }));
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ data: { user: AuthUser; accessToken: string } }>(
      '/auth/login',
      { email, password }
    );
    tokenStorage.set(data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string }) => {
      const { data } = await api.post<{ data: { user: AuthUser; accessToken: string } }>(
        '/auth/register',
        payload
      );
      tokenStorage.set(data.data.accessToken);
      setUser(data.data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStorage.clear();
      setUser(null);
      queryClient.clear();
    }
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setState(s => ({
      ...s,
      user: s.user ? { ...s.user, ...patch } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
