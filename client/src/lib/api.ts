import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = '/api/v1';
const ACCESS_KEY = 'savora_access_token';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ────────────────────────────────────────────
export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS_KEY),
  set: (t: string) => localStorage.setItem(ACCESS_KEY, t),
  clear: () => localStorage.removeItem(ACCESS_KEY),
};

// ─── Request interceptor — attach access token ────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — silent token refresh ──────────────
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(err: unknown, token?: string) {
  queue.forEach(p => (err ? p.reject(err) : p.resolve(token!)));
  queue = [];
}

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken: string = data.data.accessToken;
      tokenStorage.set(newToken);
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr);
      tokenStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
