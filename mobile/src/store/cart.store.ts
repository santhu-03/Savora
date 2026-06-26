import { create } from 'zustand';
import type { CartItem, MenuItem } from '../types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableId: string | null;
  notes: string;

  addItem:      (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem:   (itemId: string) => void;
  updateQty:    (itemId: string, delta: number) => void;
  clearCart:    () => void;
  setOrderType: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  setTableId:   (id: string) => void;
  setNotes:     (notes: string) => void;

  // Selectors
  itemCount:    () => number;
  subtotal:     () => number;
  tax:          () => number;
  serviceCharge:() => number;
  total:        () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,
  orderType: 'dine-in',
  tableId: null,
  notes: '',

  addItem: (item, restaurantId, restaurantName) => {
    const { items, restaurantId: existingRId } = get();
    // If adding from a different restaurant, clear cart
    const base = existingRId && existingRId !== restaurantId ? [] : items;
    const existing = base.find(i => i.id === item.id);
    if (existing) {
      set({ items: base.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...base, { ...item, quantity: 1 }], restaurantId, restaurantName });
    }
  },

  removeItem: (itemId) =>
    set(s => ({ items: s.items.filter(i => i.id !== itemId) })),

  updateQty: (itemId, delta) =>
    set(s => ({
      items: s.items
        .map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0),
    })),

  clearCart: () => set({ items: [], restaurantId: null, restaurantName: null, tableId: null, notes: '' }),

  setOrderType: (type) => set({ orderType: type }),
  setTableId:   (id)   => set({ tableId: id }),
  setNotes:     (n)    => set({ notes: n }),

  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),

  subtotal:  () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),

  tax: () => Math.round(get().items.reduce((s, i) => s + i.price * i.quantity, 0) * 0.05),

  serviceCharge: () => Math.round(get().items.reduce((s, i) => s + i.price * i.quantity, 0) * 0.10),

  total: () => {
    const sub = get().subtotal();
    return sub + Math.round(sub * 0.05) + Math.round(sub * 0.10);
  },
}));
