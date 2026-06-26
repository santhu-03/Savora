import mongoose from 'mongoose';
import { User, IUserDocument } from '../models/User';
import { Restaurant, IRestaurantDocument } from '../models/Restaurant';
import { Category, ICategoryDocument } from '../models/Category';
import { MenuItem, IMenuItemDocument } from '../models/MenuItem';
import { Table, ITableDocument } from '../models/Table';
import { Order, IOrderDocument } from '../models/Order';
import { Reservation, IReservationDocument } from '../models/Reservation';
import { signAccessToken } from '../utils/jwt';

let emailSeq = 0;
const uid = () => `${Date.now()}-${++emailSeq}`;

// ─── Users ────────────────────────────────────────────────────────
export async function createUser(
  overrides: Partial<IUserDocument & { password: string }> = {}
): Promise<IUserDocument> {
  const user = new User({
    name: 'Test User',
    email: `user-${uid()}@test.com`,
    password: 'Password1',
    isVerified: true,
    role: 'customer',
    ...overrides,
  });
  await user.save();
  return user;
}

export async function createStaffUser(
  restaurantId: string,
  role: 'staff' | 'kitchen' | 'manager' | 'admin' = 'staff'
): Promise<IUserDocument> {
  return createUser({ role, restaurantId: new mongoose.Types.ObjectId(restaurantId) as any });
}

/** Returns a signed access token for a given user document. */
export function getAuthToken(user: IUserDocument, restaurantId?: string): string {
  return signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    restaurantId: restaurantId ?? (user as any).restaurantId?.toString(),
  });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

// ─── Restaurant ───────────────────────────────────────────────────
const ALL_DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;

export async function createRestaurant(
  overrides: Partial<IRestaurantDocument> = {}
): Promise<IRestaurantDocument> {
  return Restaurant.create({
    name: 'Savora Test Kitchen',
    slug: `savora-test-${uid()}`,
    address: { street: '1 Test Lane', city: 'Mumbai', state: 'MH', zip: '400001' },
    contact: { phone: '+91-9000000000', email: 'test@savora.in' },
    openingHours: ALL_DAYS.map(day => ({
      day,
      open: '09:00',
      close: '22:00',
      isClosed: false,
    })),
    settings: { taxRate: 5, serviceCharge: 10, currency: 'INR', timezone: 'Asia/Kolkata' },
    isActive: true,
    subscription: { plan: 'pro', status: 'active' },
    ...overrides,
  });
}

// ─── Category ─────────────────────────────────────────────────────
export async function createCategory(
  restaurantId: string,
  overrides: Partial<ICategoryDocument> = {}
): Promise<ICategoryDocument> {
  return Category.create({
    name: 'Starters',
    restaurantId,
    sortOrder: 0,
    isActive: true,
    ...overrides,
  });
}

// ─── Menu item ────────────────────────────────────────────────────
export async function createMenuItem(
  restaurantId: string,
  categoryId: string,
  overrides: Partial<IMenuItemDocument> = {}
): Promise<IMenuItemDocument> {
  return MenuItem.create({
    name: `Paneer Tikka ${uid()}`,
    price: 299,
    restaurantId,
    category: categoryId,
    isAvailable: true,
    prepTime: 15,
    ...overrides,
  });
}

// ─── Table ────────────────────────────────────────────────────────
export async function createTable(
  restaurantId: string,
  overrides: Partial<ITableDocument> = {}
): Promise<ITableDocument> {
  return Table.create({
    restaurantId,
    tableNumber: `T-${uid()}`,
    capacity: 4,
    floor: 1,
    status: 'available',
    isActive: true,
    ...overrides,
  });
}

// ─── Order ────────────────────────────────────────────────────────
export async function createOrder(
  restaurantId: string,
  customerId: string,
  menuItemId: string,
  overrides: Partial<IOrderDocument> = {}
): Promise<IOrderDocument> {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  return Order.create({
    restaurantId,
    customerId,
    type: 'dine-in',
    orderNumber: `ORD-${datePart}-${String(Date.now()).slice(-4)}`,
    items: [
      {
        menuItemId,
        name: 'Test Item',
        price: 299,
        quantity: 1,
        modifiers: [],
        status: 'pending',
      },
    ],
    status: 'pending',
    kitchenStatus: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    subtotal: 299,
    tax: 14.95,
    serviceCharge: 29.9,
    deliveryFee: 0,
    discount: 0,
    total: 343.85,
    ...overrides,
  });
}

// ─── Reservation ──────────────────────────────────────────────────
export async function createReservation(
  restaurantId: string,
  customerId: string,
  tableId: string,
  overrides: Partial<IReservationDocument> = {}
): Promise<IReservationDocument> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return Reservation.create({
    restaurantId,
    customerId,
    tableId,
    date: tomorrow,
    timeSlot: '12:00',
    partySize: 2,
    duration: 90,
    status: 'pending',
    ...overrides,
  });
}
