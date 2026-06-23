import { Request } from 'express';

// ─── Auth ─────────────────────────────────────────────────────
export type UserRole = 'customer' | 'staff' | 'chef' | 'waiter' | 'host' | 'manager' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  tokenVersion: number;
  preferences: {
    dietary: string[];
    allergens: string[];
    seatingPreference?: 'indoor' | 'outdoor' | 'bar' | 'private';
    language: string;
    notifications: { email: boolean; sms: boolean; push: boolean };
  };
  loyaltyTier: LoyaltyTier;
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Restaurant ───────────────────────────────────────────────
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface IOperatingHours {
  day: DayOfWeek;
  open: string;
  close: string;
  isClosed: boolean;
  breaks: Array<{ start: string; end: string }>;
}

export interface IRestaurant {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  images: string[];
  cuisine: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  contact: { phone: string; email: string; website?: string };
  operatingHours: IOperatingHours[];
  totalSeats: number;
  averageRating: number;
  totalReviews: number;
  priceRange: 1 | 2 | 3 | 4;
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
  timezone: string;
  isActive: boolean;
  stripeAccountId?: string;
  settings: {
    requireDeposit: boolean;
    depositAmount: number;
    maxAdvanceBookingDays: number;
    minPartySize: number;
    maxPartySize: number;
    autoConfirmReservations: boolean;
    allowOnlineOrdering: boolean;
    allowDelivery: boolean;
    deliveryRadius: number;
    deliveryFee: number;
    freeDeliveryAbove: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Menu ─────────────────────────────────────────────────────
export type MenuType = 'main' | 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'drinks' | 'dessert' | 'seasonal' | 'special';
export type MenuStatus = 'active' | 'inactive' | 'seasonal' | 'scheduled';

export interface IMenuCategory {
  _id: string;
  name: string;
  description?: string;
  sortOrder: number;
  image?: string;
}

export interface IMenu {
  _id: string;
  restaurant: string;
  name: string;
  description?: string;
  type: MenuType;
  status: MenuStatus;
  availableFrom?: string;
  availableUntil?: string;
  availableDays: DayOfWeek[];
  categories: IMenuCategory[];
  sortOrder: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Menu Item ────────────────────────────────────────────────
export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'halal' | 'kosher' | 'organic' | 'keto' | 'low-carb';
export type Allergen = 'gluten' | 'dairy' | 'eggs' | 'nuts' | 'peanuts' | 'shellfish' | 'fish' | 'soy' | 'sesame';
export type SpiceLevel = 'none' | 'mild' | 'medium' | 'hot' | 'extra-hot';

export interface IModifierOption {
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface IMenuItemModifier {
  _id: string;
  name: string;
  type: 'addition' | 'removal' | 'substitution' | 'size';
  options: IModifierOption[];
  required: boolean;
  minSelections: number;
  maxSelections: number;
}

export interface IMenuItem {
  _id: string;
  restaurant: string;
  menu: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  basePrice: number;
  discountedPrice?: number;
  discountPercent?: number;
  currency: string;
  dietaryTags: DietaryTag[];
  allergens: Allergen[];
  spiceLevel: SpiceLevel;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  stockCount?: number;
  trackStock: boolean;
  preparationTime: number;
  calories?: number;
  nutritionInfo?: { protein: number; carbohydrates: number; fat: number; fiber: number; sodium: number };
  modifiers: IMenuItemModifier[];
  tags: string[];
  totalOrders: number;
  averageRating: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Order ────────────────────────────────────────────────────
export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'refunded';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'room_service';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'card' | 'cash' | 'upi' | 'wallet';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface IOrderItemModification {
  modifierName: string;
  optionName: string;
  priceAdjustment: number;
}

export interface IOrderItem {
  menuItem: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifications: IOrderItemModification[];
  notes?: string;
  status: ItemStatus;
  preparedAt?: Date;
  servedAt?: Date;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  restaurant: string;
  customer?: string;
  guestInfo?: { name: string; email?: string; phone?: string };
  table?: string;
  reservation?: string;
  assignedStaff?: string;
  items: IOrderItem[];
  status: OrderStatus;
  type: OrderType;
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  serviceCharge: number;
  tipAmount: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  receiptUrl?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  deliveryAddress?: { street: string; city: string; pincode: string; instructions?: string };
  notes?: string;
  kitchenNotes?: string;
  priority: 'normal' | 'high' | 'urgent';
  placedAt: Date;
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Reservation ──────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'seated' | 'completed' | 'cancelled' | 'no_show' | 'late';
export type ReservationSource = 'website' | 'app' | 'phone' | 'walk_in' | 'third_party';
export type OccasionType = 'birthday' | 'anniversary' | 'business' | 'proposal' | 'graduation' | 'other';

export interface IReservation {
  _id: string;
  restaurant: string;
  customer?: string;
  guestInfo: { name: string; email: string; phone: string };
  table?: string;
  date: Date;
  time: string;
  endTime?: string;
  duration: number;
  partySize: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  source: ReservationSource;
  confirmationCode: string;
  specialRequests?: string;
  occasion?: OccasionType;
  occasionNote?: string;
  dietaryRequirements?: string;
  seatingPreference?: 'indoor' | 'outdoor' | 'bar' | 'private';
  depositAmount: number;
  depositPaid: boolean;
  depositPaymentId?: string;
  remindersSent: number;
  lastReminderAt?: Date;
  checkedInAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  internalNotes?: string;
  staffId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Table ────────────────────────────────────────────────────
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
export type TableShape = 'round' | 'square' | 'rectangle' | 'oval';
export type TableFeature = 'window' | 'outdoor' | 'private' | 'accessible' | 'booth' | 'bar';

export interface ITable {
  _id: string;
  restaurant: string;
  number: string;
  displayName?: string;
  section: string;
  floor: number;
  shape: TableShape;
  minCapacity: number;
  maxCapacity: number;
  isJoinable: boolean;
  joinableWith: string[];
  position: { x: number; y: number };
  status: TableStatus;
  currentOrder?: string;
  currentReservation?: string;
  qrCode?: string;
  qrCodeUrl?: string;
  features: TableFeature[];
  isActive: boolean;
  lastStatusChange?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ───────────────────────────────────────────────────
export type ReviewSentiment = 'positive' | 'neutral' | 'negative';
export type ReviewSource = 'in_app' | 'google' | 'zomato' | 'swiggy';

export interface IReview {
  _id: string;
  restaurant: string;
  customer: string;
  order?: string;
  reservation?: string;
  overallRating: number;
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;
  valueRating?: number;
  title?: string;
  comment?: string;
  images: string[];
  tags: string[];
  isVerified: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  reportCount: number;
  response?: { text: string; respondedBy: string; respondedAt: Date };
  source: ReviewSource;
  sentiment?: ReviewSentiment;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Loyalty ──────────────────────────────────────────────────
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';

export interface ILoyaltyTransaction {
  type: LoyaltyTransactionType;
  points: number;
  orderId?: string;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ILoyaltyPoints {
  _id: string;
  customer: string;
  restaurant: string;
  currentPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  tier: LoyaltyTier;
  tierProgress: number;
  nextTierPoints: number;
  transactions: ILoyaltyTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Inventory ────────────────────────────────────────────────
export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'dozen' | 'box' | 'pack';
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
export type InventoryTransactionType = 'purchase' | 'usage' | 'waste' | 'adjustment' | 'return';

export interface IInventoryTransaction {
  type: InventoryTransactionType;
  quantity: number;
  unit: InventoryUnit;
  unitCost?: number;
  totalCost?: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  performedBy: string;
  createdAt: Date;
}

export interface IInventory {
  _id: string;
  restaurant: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  unit: InventoryUnit;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxStock: number;
  unitCost: number;
  totalValue: number;
  status: InventoryStatus;
  supplier?: { name: string; contact: string; email?: string; leadTime: number };
  linkedMenuItems: string[];
  transactions: IInventoryTransaction[];
  lastRestockedAt?: Date;
  expiryDate?: Date;
  storageLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Staff ────────────────────────────────────────────────────
export type StaffRole = 'chef' | 'sous_chef' | 'line_cook' | 'waiter' | 'host' | 'bartender' | 'manager' | 'cashier' | 'delivery' | 'cleaner';
export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night' | 'split';

export interface IShift {
  date: Date;
  type: ShiftType;
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hoursWorked?: number;
  station?: string;
  notes?: string;
  isAbsent: boolean;
  absenceReason?: string;
}

export interface IStaff {
  _id: string;
  user: string;
  restaurant: string;
  employeeId: string;
  role: StaffRole;
  department: string;
  joinDate: Date;
  salary: number;
  salaryType: 'hourly' | 'daily' | 'monthly';
  shifts: IShift[];
  isOnDuty: boolean;
  permissions: string[];
  performance: {
    averageRating: number;
    totalOrders: number;
    totalShifts: number;
    attendanceRate: number;
  };
  emergencyContact?: { name: string; phone: string; relation: string };
  documents: Array<{ type: string; url: string; expiryDate?: Date }>;
  isActive: boolean;
  terminatedAt?: Date;
  terminationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ─────────────────────────────────────────────
export type NotificationType =
  | 'order_placed' | 'order_confirmed' | 'order_preparing' | 'order_ready'
  | 'order_served' | 'order_cancelled' | 'payment_received' | 'payment_failed'
  | 'reservation_confirmed' | 'reservation_reminder' | 'reservation_cancelled'
  | 'table_ready' | 'review_received' | 'loyalty_points' | 'promotional'
  | 'system' | 'low_stock' | 'staff_alert';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification {
  _id: string;
  restaurant: string;
  recipient: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels: NotificationChannel[];
  status: NotificationStatus;
  readAt?: Date;
  sentAt?: Date;
  errorMessage?: string;
  expiresAt?: Date;
  actionUrl?: string;
  imageUrl?: string;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Express extensions ───────────────────────────────────────
import { UserRole as NewUserRole } from '../models/User';
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: NewUserRole;
    restaurantId?: string;
  };
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
