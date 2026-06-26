export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  image: string;
  coverImage: string;
  tags: string[];
  isOpen: boolean;
  isFavorite: boolean;
  distance: string;
  eta: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isBestSeller: boolean;
  allergens?: string[];
  calories?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  items: { id: string; name: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  type: 'dine-in' | 'takeaway' | 'delivery';
  createdAt: string;
  tableNumber?: number;
  deliveryAddress?: string;
  estimatedTime?: string;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  tableNumber?: number;
  specialRequest?: string;
  occasion?: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  image: string;
  bgColor: string;
  restaurantSlug: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}
