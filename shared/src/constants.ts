export const SAVORA_COLORS = {
  dark: '#260B10',
  gold: '#BF8B5E',
  blush: '#D9B89C',
  red: '#733122',
  copper: '#A6523F',
} as const;

export const TAX_RATE = 0.05;
export const SERVICE_CHARGE_RATE = 0.1;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const MENU_CATEGORIES = [
  { value: 'starters', label: 'Starters' },
  { value: 'mains', label: 'Main Course' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'specials', label: "Chef's Specials" },
] as const;

export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  menu: '/api/menu',
  orders: '/api/orders',
  reservations: '/api/reservations',
  tables: '/api/tables',
  payments: '/api/payments',
  reviews: '/api/reviews',
  analytics: '/api/analytics',
  users: '/api/users',
} as const;
