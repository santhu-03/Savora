import { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'manager' | 'staff';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  restaurant: string;
}

interface AuthContextType {
  user: User;
  setRole: (role: UserRole) => void;
  restaurants: string[];
  activeRestaurant: string;
  setActiveRestaurant: (r: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const RESTAURANTS = ['Savora Bandra', 'Savora Juhu', 'Savora Colaba'];

const DEFAULT_USER: User = {
  id: '1',
  name: 'Aryan Kapoor',
  email: 'aryan@savora.in',
  role: 'admin',
  restaurant: 'Savora Bandra',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [activeRestaurant, setActiveRestaurant] = useState(RESTAURANTS[0]);

  const setRole = (role: UserRole) => setUser(u => ({ ...u, role }));

  return (
    <AuthContext.Provider
      value={{ user, setRole, restaurants: RESTAURANTS, activeRestaurant, setActiveRestaurant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
