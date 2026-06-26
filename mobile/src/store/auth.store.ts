import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
}

// Mock user for demo
const MOCK_USER: User = {
  id: 'u1',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@gmail.com',
  phone: '+91 98765 43210',
  loyaltyTier: 'gold',
  loyaltyPoints: 4250,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    try {
      const token    = await SecureStore.getItemAsync('auth_token');
      const userJson = await SecureStore.getItemAsync('auth_user');
      if (token && userJson) {
        set({ token, user: JSON.parse(userJson), isAuthenticated: true });
      } else {
        // Auto-login with mock user for demo purposes
        set({ user: MOCK_USER, token: 'mock_token', isAuthenticated: true });
      }
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
