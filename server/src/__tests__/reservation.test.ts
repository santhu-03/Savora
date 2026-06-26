jest.mock('../config/socket', () => ({ getIO: () => null, initSocket: () => null }));
jest.mock('../utils/email', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    orderConfirmation: jest.fn().mockReturnValue(''),
    reservationConfirmation: jest.fn().mockReturnValue(''),
    reservationReminder: jest.fn().mockReturnValue(''),
  },
}));
jest.mock('../config/stripe', () => ({ getStripe: () => null }));
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
  createTable,
  createReservation,
  getAuthToken,
  authHeader,
} from './factories';

const app  = createTestApp();
const BASE = '/api/v1/reservations';

// Tomorrow's date in YYYY-MM-DD format — always in the future
function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Weekday name for tomorrow (needed to set opening hours)
function tomorrowDayName(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return days[d.getDay()];
}

let restaurantId: string;
let customerId: string;
let customerToken: string;
let staffToken: string;
let tableId: string;

beforeAll(async () => {
  const tomorrowDay = tomorrowDayName();

  // Restaurant open tomorrow, 9am–10pm
  const restaurant = await createRestaurant({
    openingHours: [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
    ].map(day => ({ day, open: '09:00', close: '22:00', isClosed: day !== tomorrowDay })) as any,
  });
  restaurantId = restaurant._id.toString();

  // Table that fits 2 guests
  const table = await createTable(restaurantId, { capacity: 4 });
  tableId     = table._id.toString();

  const customer  = await createUser({ email: 'res-customer@test.com' });
  customerId      = customer._id.toString();
  customerToken   = getAuthToken(customer);

  const staff = await createStaffUser(restaurantId, 'manager');
  staffToken  = getAuthToken(staff, restaurantId);
});

// ─── GET /reservations/available-slots ───────────────────────────
describe('GET /reservations/available-slots', () => {
  it('200 — returns slot list with available flag for an open restaurant', async () => {
    const res = await request(app).get(`${BASE}/available-slots`).query({
      restaurantId,
      date:      tomorrowStr(),
      partySize: 2,
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Each slot has the expected shape
    const slot = res.body.data[0];
    expect(slot).toHaveProperty('time');
    expect(slot).toHaveProperty('available');
    expect(slot).toHaveProperty('tableCount');
  });

  it('200 — returns [] when party size exceeds all table capacities', async () => {
    const res = await request(app).get(`${BASE}/available-slots`).query({
      restaurantId,
      date:      tomorrowStr(),
      partySize: 999,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('422 — missing restaurantId returns validation error', async () => {
    const res = await request(app).get(`${BASE}/available-slots`).query({
      date: tomorrowStr(), partySize: 2,
    });
    expect(res.status).toBe(422);
  });

  it('422 — missing date returns validation error', async () => {
    const res = await request(app).get(`${BASE}/available-slots`).query({
      restaurantId, partySize: 2,
    });
    expect(res.status).toBe(422);
  });
});

// ─── POST /reservations ───────────────────────────────────────────
describe('POST /reservations', () => {
  it('201 — valid reservation is created and returns confirmationCode', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        date:        `${tomorrowStr()}T12:00:00.000Z`,
        timeSlot:    '12:00',
        partySize:   2,
        duration:    90,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.confirmationCode).toMatch(/^SVR[A-F0-9]{6}$/);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.tableId).toBeDefined(); // auto-assigned
  });

  it('409 — double booking conflict returns NO_AVAILABILITY', async () => {
    const date = `${tomorrowStr()}T14:00:00.000Z`;

    // First booking fills the only table at 14:00
    await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({ restaurantId, date, timeSlot: '14:00', partySize: 2, duration: 90 });

    // Second booking for same slot — only 1 table exists, it's now taken
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({ restaurantId, date, timeSlot: '14:00', partySize: 2, duration: 90 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NO_AVAILABILITY');
  });

  it('422 — invalid time format is rejected', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        date:      `${tomorrowStr()}T10:00:00.000Z`,
        timeSlot:  '10-00', // wrong format
        partySize: 2,
      });
    expect(res.status).toBe(422);
  });

  it('422 — party size 0 is rejected', async () => {
    const res = await request(app)
      .post(BASE)
      .set(authHeader(customerToken))
      .send({
        restaurantId,
        date:      `${tomorrowStr()}T10:00:00.000Z`,
        timeSlot:  '10:00',
        partySize: 0,
      });
    expect(res.status).toBe(422);
  });

  it('401 — unauthenticated POST returns 401', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ restaurantId, date: `${tomorrowStr()}T10:00:00.000Z`, timeSlot: '10:00', partySize: 2 });
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /reservations/:id/status ──────────────────────────────
describe('PATCH /reservations/:id/status', () => {
  it('200 — staff can update status to confirmed', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId);

    const res = await request(app)
      .patch(`${BASE}/${reservation._id}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('200 — staff can mark as seated', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId, { status: 'confirmed' });

    const res = await request(app)
      .patch(`${BASE}/${reservation._id}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'seated' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('seated');
  });

  it('200 — staff can mark as no_show', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId, { status: 'confirmed' });

    const res = await request(app)
      .patch(`${BASE}/${reservation._id}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'no_show' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('no_show');
  });

  it('422 — invalid status value is rejected', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId);

    const res = await request(app)
      .patch(`${BASE}/${reservation._id}/status`)
      .set(authHeader(staffToken))
      .send({ status: 'waiting' });

    expect(res.status).toBe(422);
  });

  it('403 — customer cannot update reservation status', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId);

    const res = await request(app)
      .patch(`${BASE}/${reservation._id}/status`)
      .set(authHeader(customerToken))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /reservations/:id (cancel) ───────────────────────────
describe('DELETE /reservations/:id', () => {
  it('200 — customer can cancel their own pending reservation', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId);

    const res = await request(app)
      .delete(`${BASE}/${reservation._id}`)
      .set(authHeader(customerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('400 — already-cancelled reservation cannot be cancelled again', async () => {
    const reservation = await createReservation(restaurantId, customerId, tableId, { status: 'cancelled' });

    const res = await request(app)
      .delete(`${BASE}/${reservation._id}`)
      .set(authHeader(customerToken));

    expect(res.status).toBe(400);
  });

  it('403 — customer cannot cancel another customer\'s reservation', async () => {
    const other       = await createUser({ email: 'other-res@test.com' });
    const otherToken  = getAuthToken(other);
    const reservation = await createReservation(restaurantId, customerId, tableId);

    const res = await request(app)
      .delete(`${BASE}/${reservation._id}`)
      .set(authHeader(otherToken));

    expect(res.status).toBe(403);
  });
});
