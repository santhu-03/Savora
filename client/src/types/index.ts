export interface RestaurantAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: { lat: number; lng: number };
}

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  images: string[];
  cuisine: string[];
  address: RestaurantAddress;
  contact: { phone: string; email: string; website?: string };
  averageRating: number;
  totalReviews: number;
  priceRange: 1 | 2 | 3 | 4;
  isActive: boolean;
  operatingHours: OperatingHours[];
  taxRate: number;
  settings: {
    allowOnlineOrdering: boolean;
    allowDelivery: boolean;
    deliveryFee: number;
    freeDeliveryAbove: number;
    taxRate: number;
  };
  createdAt: string;
}

export interface MenuItemModifier {
  _id: string;
  name: string;
  type: 'addition' | 'removal' | 'substitution' | 'size';
  required: boolean;
  options: Array<{ name: string; priceAdjustment: number; isDefault: boolean; isAvailable: boolean }>;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  discountedPrice?: number;
  images: string[];
  dietaryTags: string[];
  allergens: string[];
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra-hot';
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  preparationTime: number;
  calories?: number;
  modifiers: MenuItemModifier[];
  averageRating: number;
  totalOrders: number;
  categoryId: string;
}

export interface MenuCategory {
  _id: string;
  name: string;
  description?: string;
  sortOrder: number;
  items?: MenuItem[];
}

export interface Menu {
  _id: string;
  name: string;
  type: string;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface OrderItem {
  menuItem: MenuItem | string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  modifications?: Array<{ modifierName: string; optionName: string; priceAdjustment: number }>;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  restaurant: Restaurant | string;
  items: OrderItem[];
  status: 'draft' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  type: 'dine_in' | 'takeaway' | 'delivery';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  loyaltyPointsEarned: number;
  placedAt: string;
  estimatedReadyTime?: number;
  table?: { number: string; section: string };
  deliveryAddress?: { street: string; city: string; pincode: string };
}

export interface Reservation {
  _id: string;
  restaurant: Restaurant | string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  confirmationCode: string;
  specialRequests?: string;
  occasion?: string;
  table?: { _id: string; number: string; section: string; maxCapacity: number };
}

export interface Review {
  _id: string;
  customer: { _id: string; name: string; avatar?: string };
  overallRating: number;
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;
  comment?: string;
  tags: string[];
  sentiment?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface LoyaltyRecord {
  _id: string;
  restaurant: Restaurant;
  currentPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierProgress: number;
  nextTierPoints: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  tablesAvailable: number;
}

export interface TableLayout {
  _id: string;
  number: string;
  section: string;
  minCapacity: number;
  maxCapacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
}
