import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  login:    (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post('/auth/register', data),
  me:       () => api.get('/auth/me'),
  logout:   () => api.post('/auth/logout'),
};

// Restaurants
export const restaurantApi = {
  list:   (params?: { search?: string; category?: string }) =>
    api.get('/restaurants', { params }),
  bySlug: (slug: string) => api.get(`/restaurants/${slug}`),
  menu:   (slug: string) => api.get(`/restaurants/${slug}/menu`),
};

// Orders
export const orderApi = {
  create: (data: unknown) => api.post('/orders', data),
  list:   ()               => api.get('/orders'),
  byId:   (id: string)     => api.get(`/orders/${id}`),
};

// Reservations
export const reservationApi = {
  create: (data: unknown)  => api.post('/reservations', data),
  list:   ()               => api.get('/reservations'),
  byId:   (id: string)     => api.get(`/reservations/${id}`),
  cancel: (id: string)     => api.patch(`/reservations/${id}/cancel`),
};

// Payment
export const paymentApi = {
  createIntent: (data: { amount: number; orderId: string }) =>
    api.post('/payments/intent', data),
};

// Profile
export const profileApi = {
  update:    (data: unknown)       => api.patch('/profile', data),
  addresses: ()                    => api.get('/profile/addresses'),
  addAddress:(data: unknown)       => api.post('/profile/addresses', data),
  loyalty:   ()                    => api.get('/profile/loyalty'),
};
