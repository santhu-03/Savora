jest.mock('../config/socket', () => ({ getIO: () => null, initSocket: () => null }));
jest.mock('../utils/email', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    orderConfirmation: jest.fn().mockReturnValue(''),
    reservationConfirmation: jest.fn().mockReturnValue(''),
    reservationReminder: jest.fn().mockReturnValue(''),
  },
}));
jest.mock('../config/stripe', () => ({
  getStripe: () => ({
    paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'pi_test_secret' }) },
  }),
}));
jest.mock('../config/redis', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(1),
  },
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../middleware/rateLimiter', () => ({
  authLimiter:    (_r: any, _s: any, n: any) => n(),
  strictLimiter:  (_r: any, _s: any, n: any) => n(),
  apiLimiter:     (_r: any, _s: any, n: any) => n(),
  uploadLimiter:  (_r: any, _s: any, n: any) => n(),
  webhookLimiter: (_r: any, _s: any, n: any) => n(),
  otpLimiter:     jest.fn().mockResolvedValue(true),
}));

import request from 'supertest';
import { createTestApp } from './testApp';
import {
  createUser,
  createStaffUser,
  createRestaurant,
  createCategory,
  createMenuItem,
  createOrder,
  getAuthToken,
  authHeader,
} from './factories';

const app  = createTestApp();
const BASE = '/api/v1/orders';

// ─── Shared fixtures ──────────────────────────────────────────────
let restaurantId: string;
let customerToken: string;
let staffToken: string;
let availableItemId: string;
let unavailableItemId: string;
let customerId: string;

beforeAll(async () => {
  const restaurant  = await createRestaurant();
  restaurantId      = restaurant._id.toString();

  const category    = await createCategory(restaurantId);
  const catId       = category._id.toString();

  const available   = await createMenuItem(restaurantId, catId, { name: 'Palak Paneer', price: 180 });
  availableItemId   = available._id.toString();

  const unavailable = await createMenuItem(restaurantId, catId, { name: 'Sold Out Dish', price: 220, isAvailable: false });
  unavailableItemId = unavailable._id.toString();

  const customer    = await createUser({ email: 'customer@order.test' });
  customerId        = customer._id.toString();
  customerToken     = getAuthToken(customer);

  const staff       = await createStaffUser(restaurantId, 'staff');
  staffToken        = getAuthToken(staff, restaurantId);
});

// ─── POST /orders ─────────────────────────────────────────────────
describe('POST /orders — create order', () => {
  it('201 — valid dine-in cart creates an order', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        type:          'dine-in',
        paymentMethod: 'cash',
        items:         [{ menuItemId: availableItemId, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.subtotal).toBeCloseTo(360, 1); // 180 × 2
  });

  it('201 — guest (no auth) can place a cash order', async () => {
    const res = await request(app)
      .post(BASE)
      .send({
        restaurantId,
        type:          'takeaway',
        paymentMethod: 'cash',
        items:         [{ menuItemId: availableItemId, quantity: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.customerId).toBeUndefined(); // no customer
  });

  it('422 — empty items array is rejected', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({ restaurantId, type: 'dine-in', items: [] });

    expect(res.status).toBe(422);
  });

  it('422 — missing restaurantId is rejected', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({ type: 'dine-in', items: [{ menuItemId: availableItemId, quantity: 1 }] });

    expect(res.status).toBe(422);
  });

  it('422 — invalid order type is rejected', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({ restaurantId, type: 'eat-here', items: [{ menuItemId: availableItemId, quantity: 1 }] });

    expect(res.status).toBe(422);
  });

  it('400 — ordering an unavailable item is rejected', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        type:  'dine-in',
        items: [{ menuItemId: unavailableItemId, quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  it('404 — non-existent menuItemId returns 404', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        type:  'dine-in',
        items: [{ menuItemId: '000000000000000000000099', quantity: 1 }],
      });

    expect(res.status).toBe(404);
  });

  it('calculates total including tax and service charge', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        type:          'dine-in',
        paymentMethod: 'cash',
        items:         [{ menuItemId: availableItemId, quantity: 1 }],
      });

    expect(res.status).toBe(201);
    const { subtotal, tax, serviceCharge, total } = res.body.data;
    expect(subtotal).toBeCloseTo(180, 1);
    expect(tax).toBeCloseTo(180 * 0.05, 1);       // 5 % tax
    expect(serviceCharge).toBeCloseTo(180 * 0.10, 1); // 10 % service charge
    expect(total).toBeCloseTo(subtotal + tax + serviceCharge, 1);
  });
});

// ─── PATCH /orders/:id/status ─────────────────────────────────────
describe('PATCH /orders/:id/status', () => {
  let orderId: string;

  beforeEach(async () => {
    const order = await createOrder(restaurantId, customerId, availableItemId);
    orderId = order._id.toString();
  });

  it('200 — staff can advance status from pending → confirmed', async () => {
    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('200 — staff can advance status confirmed → preparing', async () => {
    // First confirm
    await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'confirmed' });

    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'preparing' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('preparing');
  });

  it('400 — invalid status transition is rejected', async () => {
    // pending → delivered (not allowed)
    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'delivered' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('422 — invalid status value is rejected', async () => {
    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(422);
  });

  it('403 — customer cannot update order status', async () => {
    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set(authHeader(customerToken))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });

  it('401 — unauthenticated request returns 401', async () => {
    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(401);
  });

  it('404 — non-existent order returns 404', async () => {
    const res = await request(app)
      .patch(`${BASE}/000000000000000000000099/status`)
      .set(authHeader(staffToken))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /orders/:id/cancel ─────────────────────────────────────
describe('PATCH /orders/:id/cancel', () => {
  it('200 — customer can cancel their own pending order', async () => {
    const order = await createOrder(restaurantId, customerId, availableItemId);

    const res = await request(app)
      .patch(`${BASE}/${order._id}/cancel`)
      .set(authHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('400 — customer cannot cancel a non-pending order', async () => {
    const order = await createOrder(restaurantId, customerId, availableItemId, { status: 'confirmed' });

    const res = await request(app)
      .patch(`${BASE}/${order._id}/cancel`)
      .set(authHeader(customerToken));

    expect(res.status).toBe(400);
  });

  it('400 — already-cancelled order cannot be cancelled again', async () => {
    const order = await createOrder(restaurantId, customerId, availableItemId, { status: 'cancelled' });

    const res = await request(app)
      .patch(`${BASE}/${order._id}/cancel`)
      .set(authHeader(customerToken));

    expect(res.status).toBe(400);
  });

  it('403 — customer cannot cancel another user\'s order', async () => {
    const other       = await createUser({ email: 'other@order.test' });
    const otherToken  = getAuthToken(other);
    const order       = await createOrder(restaurantId, customerId, availableItemId);

    const res = await request(app)
      .patch(`${BASE}/${order._id}/cancel`)
      .set(authHeader(otherToken));

    expect(res.status).toBe(403);
  });

  it('200 — staff can cancel any order regardless of status', async () => {
    const order = await createOrder(restaurantId, customerId, availableItemId, { status: 'confirmed' });

    const res = await request(app)
      .patch(`${BASE}/${order._id}/cancel`)
      .set(authHeader(staffToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });
});
