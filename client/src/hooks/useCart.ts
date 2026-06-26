import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  modifications?: Array<{ name: string; value: string; price: number }>;
  notes?: string;
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      items: [],

      addItem(restaurantId, item) {
        set(state => {
          // Clear cart if switching restaurants
          if (state.restaurantId && state.restaurantId !== restaurantId) {
            return { restaurantId, items: [{ ...item, quantity: 1 }] };
          }

          const existing = state.items.find(i => i.menuItemId === item.menuItemId);
          if (existing) {
            return {
              restaurantId,
              items: state.items.map(i =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }

          return { restaurantId, items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
        });
      },

      removeItem(menuItemId) {
        set(state => ({
          items: state.items.filter(i => i.menuItemId !== menuItemId),
          restaurantId: state.items.length <= 1 ? null : state.restaurantId,
        }));
      },

      updateQuantity(menuItemId, quantity) {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        }));
      },

      updateNotes(menuItemId, notes) {
        set(state => ({
          items: state.items.map(i =>
            i.menuItemId === menuItemId ? { ...i, notes } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], restaurantId: null }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (sum, i) =>
            sum +
            i.quantity *
              (i.price + (i.modifications?.reduce((s, m) => s + m.price, 0) ?? 0)),
          0
        ),
    }),
    {
      name: 'savora-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ restaurantId: state.restaurantId, items: state.items }),
    }
  )
);
