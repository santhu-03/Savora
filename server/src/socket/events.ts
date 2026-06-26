/**
 * Canonical TypeScript types for every Socket.io event in Savora.
 * Import these on both server and client to keep payloads in sync.
 */

// ─── Shared value types ────────────────────────────────────────
export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'delivered' | 'cancelled';

export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type ReservationStatus =
  | 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

// ─── Server → Client payloads ──────────────────────────────────
export interface NewOrderPayload {
  orderId:      string;
  orderNumber:  string;
  type:         'dine-in' | 'takeaway' | 'delivery';
  total:        number;
  itemCount:    number;
  tableNumber?: string;
  tableId?:     string;
  items:        Array<{
    id:                   string;
    name:                 string;
    quantity:             number;
    status:               ItemStatus;
    specialInstructions?: string;
  }>;
  customerName?: string;
  notes?:        string;
  createdAt:     string;
}

export interface OrderStatusUpdatedPayload {
  orderId:       string;
  orderNumber:   string;
  status:        OrderStatus;
  estimatedTime?: number;   // remaining minutes
  updatedBy?:    string;
}

export interface OrderCancelledPayload {
  orderId:     string;
  orderNumber: string;
  reason?:     string;
}

export interface OrderItemReadyPayload {
  orderId:      string;
  orderNumber:  string;
  itemId:       string;
  itemName:     string;
  allItemsReady: boolean;
}

export interface ReservationCreatedPayload {
  reservationId:   string;
  customerName:    string;
  customerEmail:   string;
  date:            string;  // ISO
  timeSlot:        string;  // HH:MM
  partySize:       number;
  specialRequests?: string;
  occasion?:       string;
}

export interface ReservationStatusChangedPayload {
  reservationId: string;
  status:        ReservationStatus;
  tableId?:      string;
  tableNumber?:  string;
  customerName?: string;
}

export interface ReservationConfirmedPayload {
  reservationId:    string;
  restaurantName:   string;
  restaurantAddress?: string;
  date:             string;
  timeSlot:         string;
  tableNumber?:     string;
  confirmationCode: string;
}

export interface TableStatusChangedPayload {
  tableId:     string;
  tableNumber: string;
  section?:    string;
  status:      TableStatus;
  orderId?:    string;
}

export interface LowStockAlertPayload {
  itemId:       string;
  itemName:     string;
  category:     string;
  currentStock: number;
  threshold:    number;
  unit:         string;
  restaurantId: string;
}

export interface NewReviewPayload {
  reviewId:     string;
  customerName: string;
  rating:       number;
  comment?:     string;
  restaurantId: string;
  menuItemId?:  string;
  createdAt:    string;
}

// ─── Client → Server payloads ──────────────────────────────────
export interface JoinRestaurantPayload  { restaurantId: string }
export interface JoinKitchenPayload     { restaurantId: string }
export interface JoinOrderPayload       { orderId: string }
export interface JoinTablePayload       { restaurantId: string; tableId: string }

export interface KitchenUpdateStatusPayload {
  orderId:      string;
  restaurantId: string;
  itemId?:      string;    // omit to update whole order
  status:       ItemStatus | OrderStatus;
}

// ─── Room name helpers ──────────────────────────────────────────
export const room = {
  restaurant: (id: string) => `restaurant:${id}`,
  kitchen:    (id: string) => `kitchen:${id}`,
  order:      (id: string) => `order:${id}`,
  table:      (rId: string, tId: string) => `table:${rId}:${tId}`,
  user:       (id: string) => `user:${id}`,
};

// ─── Event name constants ───────────────────────────────────────
export const EVENT = {
  // Server → Client
  NEW_ORDER:                   'new_order',
  ORDER_STATUS_UPDATED:        'order_status_updated',
  ORDER_CANCELLED:             'order_cancelled',
  ORDER_ITEM_READY:            'order_item_ready',
  RESERVATION_CREATED:         'reservation_created',
  RESERVATION_STATUS_CHANGED:  'reservation_status_changed',
  RESERVATION_CONFIRMED:       'reservation_confirmed',
  TABLE_STATUS_CHANGED:        'table_status_changed',
  LOW_STOCK_ALERT:             'low_stock_alert',
  NEW_REVIEW:                  'new_review',

  // Client → Server
  JOIN_RESTAURANT:             'join_restaurant',
  JOIN_KITCHEN:                'join_kitchen',
  JOIN_ORDER_TRACKING:         'join_order_tracking',
  JOIN_TABLE:                  'join_table',
  KITCHEN_UPDATE_STATUS:       'kitchen_update_status',
} as const;
