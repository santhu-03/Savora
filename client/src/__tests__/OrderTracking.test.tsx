import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock API ─────────────────────────────────────────────────────
const mockGet = vi.fn();
vi.mock('@/lib/api', () => ({
  api:         { get: mockGet },
  default:     { get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  tokenStorage: { get: vi.fn(() => null), set: vi.fn(), clear: vi.fn() },
}));

// ─── Mock socket event hook ───────────────────────────────────────
vi.mock('@/hooks/useSocket', () => ({
  useSocketEvent: vi.fn(),
  useSocket:      vi.fn(() => ({ connected: false })),
}));

// ─── Mock PageLayout to avoid nav complexity ──────────────────────
vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: any) => <div data-testid="page-layout">{children}</div>,
}));

// ─── Mock utils ───────────────────────────────────────────────────
vi.mock('@/lib/utils', () => ({
  formatCurrency: (n: number) => `₹${n}`,
  formatDate:     (d: string) => d,
  cn:             (...args: any[]) => args.filter(Boolean).join(' '),
}));

import OrderTracking from '@/pages/OrderTracking';

function makeOrder(overrides = {}) {
  return {
    _id:         'order-001',
    orderNumber: 'ORD-20260101-0001',
    status:      'confirmed',
    type:        'dine-in',
    items: [
      { menuItemId: 'item-1', name: 'Paneer Tikka', price: 299, quantity: 2, status: 'pending', modifiers: [] },
    ],
    subtotal:      598,
    tax:           29.9,
    serviceCharge: 59.8,
    deliveryFee:   0,
    total:         687.7,
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    createdAt:     new Date().toISOString(),
    ...overrides,
  };
}

function renderTracking(orderId = 'order-001') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderTracking />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────
describe('OrderTracking page', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renders all 4 status steps', async () => {
    mockGet.mockResolvedValue({ data: { data: makeOrder() } });
    renderTracking();

    await waitFor(() => {
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Served')).toBeInTheDocument();
    });
  });

  it('highlights the current status step', async () => {
    mockGet.mockResolvedValue({ data: { data: makeOrder({ status: 'preparing' }) } });
    renderTracking();

    await waitFor(() => {
      // The "In progress" badge should appear next to the active step
      expect(screen.getByText('In progress')).toBeInTheDocument();
    });
  });

  it('displays the order number in the heading', async () => {
    mockGet.mockResolvedValue({ data: { data: makeOrder() } });
    renderTracking();

    await waitFor(() => {
      expect(screen.getByText(/ORD-20260101-0001/)).toBeInTheDocument();
    });
  });

  it('displays each ordered item name', async () => {
    mockGet.mockResolvedValue({ data: { data: makeOrder() } });
    renderTracking();

    await waitFor(() => {
      expect(screen.getByText(/Paneer Tikka/i)).toBeInTheDocument();
    });
  });

  it('shows "Order not found" when API returns no data', async () => {
    mockGet.mockResolvedValue({ data: { data: null } });
    renderTracking();

    await waitFor(() => {
      expect(screen.getByText(/order not found/i)).toBeInTheDocument();
    });
  });

  it('shows all steps as done when order is completed', async () => {
    mockGet.mockResolvedValue({ data: { data: makeOrder({ status: 'completed' }) } });
    renderTracking();

    await waitFor(() => {
      // No "In progress" badge — all steps done
      expect(screen.queryByText('In progress')).not.toBeInTheDocument();
    });
  });
});

// ─── TrackingStep unit logic ──────────────────────────────────────
describe('Status ordering logic', () => {
  const STATUS_ORDER = ['confirmed', 'preparing', 'ready', 'served', 'completed'];
  const statusIndex  = (s: string) => STATUS_ORDER.indexOf(s);

  it('confirmed comes before preparing', () => {
    expect(statusIndex('confirmed')).toBeLessThan(statusIndex('preparing'));
  });

  it('preparing comes before ready', () => {
    expect(statusIndex('preparing')).toBeLessThan(statusIndex('ready'));
  });

  it('ready comes before served', () => {
    expect(statusIndex('ready')).toBeLessThan(statusIndex('served'));
  });

  it('unknown status returns -1', () => {
    expect(statusIndex('pending')).toBe(-1);
  });
});
