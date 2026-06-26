import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from '@/hooks/useCart';

// ─── Reset store between tests ────────────────────────────────────
beforeEach(() => {
  useCart.getState().clearCart();
});

const R1 = 'restaurant-1';
const R2 = 'restaurant-2';

const item1 = {
  menuItemId: 'item-001',
  name:       'Paneer Tikka',
  price:      299,
  quantity:   1,
};

const item2 = {
  menuItemId: 'item-002',
  name:       'Dal Makhani',
  price:      180,
  quantity:   1,
};

const itemWithMod = {
  menuItemId: 'item-003',
  name:       'Butter Chicken',
  price:      250,
  quantity:   1,
  modifications: [{ name: 'Size', value: 'Large', price: 50 }],
};

// ─── addItem ─────────────────────────────────────────────────────
describe('addItem', () => {
  it('adds a new item to an empty cart', () => {
    useCart.getState().addItem(R1, item1);
    const { items, restaurantId } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].menuItemId).toBe('item-001');
    expect(restaurantId).toBe(R1);
  });

  it('increments quantity when adding the same item again', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().addItem(R1, { ...item1, quantity: 2 });
    const { items } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3); // 1 + 2
  });

  it('clears cart and adds item when switching restaurants', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().addItem(R2, item2); // different restaurant
    const { items, restaurantId } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].menuItemId).toBe('item-002');
    expect(restaurantId).toBe(R2);
  });

  it('adds multiple distinct items to the same cart', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().addItem(R1, item2);
    expect(useCart.getState().items).toHaveLength(2);
  });

  it('defaults quantity to 1 when item quantity is not specified', () => {
    useCart.getState().addItem(R1, { ...item1, quantity: 0 });
    const { items } = useCart.getState();
    // quantity 0 → store saves as provided; internal add sets quantity: item.quantity || 1
    expect(items[0].quantity).toBeGreaterThanOrEqual(1);
  });
});

// ─── removeItem ──────────────────────────────────────────────────
describe('removeItem', () => {
  it('removes an item by menuItemId', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().addItem(R1, item2);
    useCart.getState().removeItem('item-001');
    const { items } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].menuItemId).toBe('item-002');
  });

  it('resets restaurantId when last item is removed', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().removeItem('item-001');
    expect(useCart.getState().restaurantId).toBeNull();
  });

  it('no-ops gracefully when removing a non-existent menuItemId', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().removeItem('does-not-exist');
    expect(useCart.getState().items).toHaveLength(1);
  });
});

// ─── updateQuantity ──────────────────────────────────────────────
describe('updateQuantity', () => {
  it('updates item quantity to a positive value', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().updateQuantity('item-001', 5);
    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it('removes item when quantity is set to 0', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().updateQuantity('item-001', 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it('removes item when quantity is negative', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().updateQuantity('item-001', -1);
    expect(useCart.getState().items).toHaveLength(0);
  });
});

// ─── updateNotes ─────────────────────────────────────────────────
describe('updateNotes', () => {
  it('stores item-level notes', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().updateNotes('item-001', 'No onions please');
    expect(useCart.getState().items[0].notes).toBe('No onions please');
  });

  it('updates existing notes', () => {
    useCart.getState().addItem(R1, { ...item1, notes: 'Less spice' });
    useCart.getState().updateNotes('item-001', 'Extra spice');
    expect(useCart.getState().items[0].notes).toBe('Extra spice');
  });
});

// ─── clearCart ───────────────────────────────────────────────────
describe('clearCart', () => {
  it('empties items and nullifies restaurantId', () => {
    useCart.getState().addItem(R1, item1);
    useCart.getState().addItem(R1, item2);
    useCart.getState().clearCart();
    const { items, restaurantId } = useCart.getState();
    expect(items).toHaveLength(0);
    expect(restaurantId).toBeNull();
  });
});

// ─── totalItems ──────────────────────────────────────────────────
describe('totalItems', () => {
  it('returns 0 for empty cart', () => {
    expect(useCart.getState().totalItems()).toBe(0);
  });

  it('sums quantities across all items', () => {
    useCart.getState().addItem(R1, { ...item1, quantity: 3 });
    useCart.getState().addItem(R1, { ...item2, quantity: 2 });
    expect(useCart.getState().totalItems()).toBe(5);
  });
});

// ─── totalPrice ──────────────────────────────────────────────────
describe('totalPrice', () => {
  it('returns 0 for empty cart', () => {
    expect(useCart.getState().totalPrice()).toBe(0);
  });

  it('calculates base price × quantity', () => {
    useCart.getState().addItem(R1, { ...item1, quantity: 2 }); // 299 × 2 = 598
    useCart.getState().addItem(R1, { ...item2, quantity: 1 }); // 180 × 1 = 180
    expect(useCart.getState().totalPrice()).toBeCloseTo(778, 2);
  });

  it('includes modification prices in total', () => {
    useCart.getState().addItem(R1, { ...itemWithMod, quantity: 2 }); // (250 + 50) × 2 = 600
    expect(useCart.getState().totalPrice()).toBeCloseTo(600, 2);
  });

  it('recalculates after quantity update', () => {
    useCart.getState().addItem(R1, item1); // 299 × 1
    useCart.getState().updateQuantity('item-001', 3); // 299 × 3 = 897
    expect(useCart.getState().totalPrice()).toBeCloseTo(897, 2);
  });

  it('recalculates after item removal', () => {
    useCart.getState().addItem(R1, item1); // 299
    useCart.getState().addItem(R1, item2); // 180
    useCart.getState().removeItem('item-001');
    expect(useCart.getState().totalPrice()).toBeCloseTo(180, 2);
  });
});
