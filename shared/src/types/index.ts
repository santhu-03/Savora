// ─── User ───────────────────────────────────────────────────
export type UserRole = 'customer' | 'staff' | 'manager' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Menu ────────────────────────────────────────────────────
export type MenuCategory =
  | 'starters'
  | 'mains'
  | 'desserts'
  | 'beverages'
  | 'specials';

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  allergens: string[];
  preparationTime: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Table ───────────────────────────────────────────────────
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface Table {
  _id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  section?: string;
  qrCode?: string;
}

// ─── Reservation ─────────────────────────────────────────────
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Reservation {
  _id: string;
  customer: User | string;
  table: Table | string;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Order ───────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface OrderItem {
  menuItem: MenuItem | string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  modifications: string[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer?: User | string;
  table?: Table | string;
  reservation?: Reservation | string;
  items: OrderItem[];
  status: OrderStatus;
  type: OrderType;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment ─────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'cash' | 'wallet' | 'upi';

export interface Payment {
  _id: string;
  order: Order | string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
  createdAt: string;
}

// ─── Review ──────────────────────────────────────────────────
export interface Review {
  _id: string;
  customer: User | string;
  order?: Order | string;
  rating: number;
  comment?: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalReservations: number;
  avgOrderValue: number;
  occupancyRate: number;
  topItems: Array<{ item: MenuItem; count: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
}

// ─── API Responses ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Auth ────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  name: string;
  phone?: string;
}

// ─── Socket Events ───────────────────────────────────────────
export interface ServerToClientEvents {
  orderUpdated: (order: Order) => void;
  tableStatusChanged: (table: Table) => void;
  newReservation: (reservation: Reservation) => void;
  kitchenAlert: (message: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  updateOrderStatus: (payload: { orderId: string; status: OrderStatus }) => void;
}
