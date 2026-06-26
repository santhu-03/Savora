import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';

// ─── Mocks ────────────────────────────────────────────────────────
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user:            { _id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'customer', isVerified: true },
    isAuthenticated: true,
    isLoading:       false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

const mockPost = vi.fn();
const mockGet  = vi.fn();
vi.mock('@/lib/api', () => ({
  api:         { post: mockPost, get: mockGet },
  default:     { post: mockPost, get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  tokenStorage: { get: vi.fn(() => 'token'), set: vi.fn(), clear: vi.fn() },
}));

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
}));

// Stripe — completely stub it out
vi.mock('@stripe/react-stripe-js', () => ({
  Elements:        ({ children }: any) => children,
  PaymentElement:  () => <div data-testid="stripe-payment-element" />,
  useStripe:       () => null,
  useElements:     () => null,
}));
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/lib/utils', () => ({
  formatCurrency: (n: number) => `₹${n}`,
  formatDate:     (d: string) => d,
  cn:             (...args: any[]) => args.filter(Boolean).join(' '),
}));

import Cart from '@/pages/Cart';

const RESTAURANT_ID = 'rest-001';

const ITEM_A = { menuItemId: 'item-a', name: 'Paneer Tikka', price: 299, quantity: 1 };
const ITEM_B = { menuItemId: 'item-b', name: 'Dal Makhani',  price: 180, quantity: 2 };

function renderCart() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── Reset cart before each test ─────────────────────────────────
beforeEach(() => {
  useCart.getState().clearCart();
  mockPost.mockReset();
  mockGet.mockReset();
});

// ─── Empty cart ───────────────────────────────────────────────────
describe('Cart — empty state', () => {
  it('shows empty cart message when no items', () => {
    renderCart();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});

// ─── Items display ────────────────────────────────────────────────
describe('Cart — items display', () => {
  beforeEach(() => {
    useCart.getState().addItem(RESTAURANT_ID, ITEM_A);
    useCart.getState().addItem(RESTAURANT_ID, ITEM_B);
  });

  it('renders all cart items', () => {
    renderCart();
    expect(screen.getByText('Paneer Tikka')).toBeInTheDocument();
    expect(screen.getByText('Dal Makhani')).toBeInTheDocument();
  });

  it('displays item prices', () => {
    renderCart();
    // Item A: 299, Item B: 180 × 2 = 360
    expect(screen.getByText(/₹299/)).toBeInTheDocument();
    expect(screen.getByText(/₹180/)).toBeInTheDocument();
  });

  it('shows correct item quantities', () => {
    renderCart();
    // "2" should appear for ITEM_B
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });
});

// ─── Total calculation ────────────────────────────────────────────
describe('Cart — total calculation', () => {
  it('shows the subtotal correctly', () => {
    useCart.getState().addItem(RESTAURANT_ID, ITEM_A); // 299
    useCart.getState().addItem(RESTAURANT_ID, ITEM_B); // 180 × 2 = 360
    // subtotal = 659
    renderCart();
    expect(screen.getByText(/₹659/)).toBeInTheDocument();
  });

  it('updates total after quantity change', async () => {
    useCart.getState().addItem(RESTAURANT_ID, ITEM_A);
    renderCart();
    const user = userEvent.setup();

    // Find "+" button for ITEM_A (quantity 1 → 2)
    const increaseButtons = screen.getAllByRole('button', { name: /\+/ });
    await user.click(increaseButtons[0]);

    await waitFor(() => {
      // New subtotal: 299 × 2 = 598
      expect(screen.getByText(/₹598/)).toBeInTheDocument();
    });
  });

  it('removes item from display when quantity reaches zero', async () => {
    useCart.getState().addItem(RESTAURANT_ID, ITEM_A);
    renderCart();
    const user = userEvent.setup();

    const decreaseButtons = screen.getAllByRole('button', { name: /−|-/ });
    await user.click(decreaseButtons[0]); // 1 → 0 → removes

    await waitFor(() => {
      expect(screen.queryByText('Paneer Tikka')).not.toBeInTheDocument();
    });
  });
});

// ─── Order type selection ─────────────────────────────────────────
describe('Cart — order type selection', () => {
  beforeEach(() => {
    useCart.getState().addItem(RESTAURANT_ID, ITEM_A);
  });

  it('shows order type options (dine-in, takeaway, delivery)', () => {
    renderCart();
    expect(screen.getByText(/dine.?in/i)).toBeInTheDocument();
    expect(screen.getByText(/takeaway/i)).toBeInTheDocument();
  });
});

// ─── Checkout ────────────────────────────────────────────────────
describe('Cart — checkout', () => {
  beforeEach(() => {
    useCart.getState().addItem(RESTAURANT_ID, ITEM_A);
    mockPost.mockResolvedValue({
      data: {
        data: { _id: 'order-new', orderNumber: 'ORD-20260101-0001', status: 'pending' },
      },
    });
  });

  it('renders a Place Order or Proceed button', () => {
    renderCart();
    const btn = screen.queryByRole('button', { name: /place order|proceed|checkout/i });
    expect(btn).toBeTruthy();
  });
});
