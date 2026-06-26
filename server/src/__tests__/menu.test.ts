jest.mock('../config/socket', () => ({ getIO: () => null, initSocket: () => null }));
jest.mock('../utils/email', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {},
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
// Multer should be a passthrough no-op in tests (no file system writes)
jest.mock('multer', () => {
  const m: any = () => ({
    array: () => (_req: any, _res: any, next: any) => next(),
    single: () => (_req: any, _res: any, next: any) => next(),
    fields: () => (_req: any, _res: any, next: any) => next(),
  });
  m.diskStorage = () => ({});
  m.memoryStorage = () => ({});
  return m;
});
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));

import request from 'supertest';
import { createTestApp } from './testApp';
import {
  createUser,
  createStaffUser,
  createRestaurant,
  createCategory,
  createMenuItem,
  getAuthToken,
  authHeader,
} from './factories';

const app  = createTestApp();
const MENU_BASE = '/api/v1/menu-items';

let restaurantId: string;
let adminToken: string;
let catStartersId: string;
let catMainsId: string;

beforeAll(async () => {
  const restaurant = await createRestaurant();
  restaurantId     = restaurant._id.toString();

  const admin  = await createStaffUser(restaurantId, 'admin');
  adminToken   = getAuthToken(admin, restaurantId);

  const starters = await createCategory(restaurantId, { name: 'Starters', sortOrder: 0 });
  catStartersId  = starters._id.toString();

  const mains  = await createCategory(restaurantId, { name: 'Mains', sortOrder: 1 });
  catMainsId   = mains._id.toString();

  // 2 starters + 3 mains
  await createMenuItem(restaurantId, catStartersId, { name: 'Samosa',      price: 60 });
  await createMenuItem(restaurantId, catStartersId, { name: 'Spring Roll', price: 80 });
  await createMenuItem(restaurantId, catMainsId,    { name: 'Dal Makhani', price: 180 });
  await createMenuItem(restaurantId, catMainsId,    { name: 'Butter Chicken', price: 250 });
  await createMenuItem(restaurantId, catMainsId,    { name: 'Biryani',     price: 220, isFeatured: true });

  // One unavailable item — should not appear in grouped menu
  await createMenuItem(restaurantId, catMainsId, { name: 'Off Season Dish', price: 300, isAvailable: false });
});

// ─── GET /menu-items/restaurant/:restaurantId ─────────────────────
describe('GET /menu-items/restaurant/:restaurantId', () => {
  it('200 — returns grouped menu with categories and items', async () => {
    const res = await request(app).get(`${MENU_BASE}/restaurant/${restaurantId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { grouped } = res.body.data;
    expect(Array.isArray(grouped)).toBe(true);
    expect(grouped.length).toBeGreaterThanOrEqual(2); // starters + mains

    const starters = grouped.find((g: any) => g.category.name === 'Starters');
    expect(starters).toBeDefined();
    expect(starters.items).toHaveLength(2);

    const mains = grouped.find((g: any) => g.category.name === 'Mains');
    expect(mains).toBeDefined();
    expect(mains.items).toHaveLength(3); // unavailable item excluded
  });

  it('200 — categories are sorted by sortOrder', async () => {
    const res = await request(app).get(`${MENU_BASE}/restaurant/${restaurantId}`);

    expect(res.status).toBe(200);
    const names = res.body.data.grouped.map((g: any) => g.category.name);
    expect(names.indexOf('Starters')).toBeLessThan(names.indexOf('Mains'));
  });

  it('200 — total count matches visible items only', async () => {
    const res = await request(app).get(`${MENU_BASE}/restaurant/${restaurantId}`);
    expect(res.body.data.total).toBe(5); // 2 starters + 3 available mains
  });

  it('200 — filters by category query param (flat list)', async () => {
    const res = await request(app)
      .get(`${MENU_BASE}/restaurant/${restaurantId}`)
      .query({ category: catStartersId });

    expect(res.status).toBe(200);
    // Flat list returned when filtering by category
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    res.body.data.items.forEach((item: any) => {
      expect(item.category.toString()).toBe(catStartersId);
    });
  });

  it('200 — sorts by price_asc correctly', async () => {
    const res = await request(app)
      .get(`${MENU_BASE}/restaurant/${restaurantId}`)
      .query({ category: catMainsId, sortBy: 'price_asc' });

    expect(res.status).toBe(200);
    const prices = res.body.data.items.map((i: any) => i.price);
    for (let j = 1; j < prices.length; j++) {
      expect(prices[j]).toBeGreaterThanOrEqual(prices[j - 1]);
    }
  });

  it('200 — empty result for unknown restaurant', async () => {
    const fakeId = '000000000000000000000099';
    const res = await request(app).get(`${MENU_BASE}/restaurant/${fakeId}`);
    // Either empty grouped array or total = 0
    expect(res.status).toBe(200);
    const { grouped, total } = res.body.data;
    const itemCount = grouped
      ? grouped.reduce((s: number, g: any) => s + (g.items?.length ?? 0), 0)
      : total ?? 0;
    expect(itemCount).toBe(0);
  });
});

// ─── GET /menu-items/restaurant/:restaurantId/featured ────────────
describe('GET /menu-items/restaurant/:restaurantId/featured', () => {
  it('200 — returns only featured items', async () => {
    const res = await request(app).get(`${MENU_BASE}/restaurant/${restaurantId}/featured`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // We seeded 1 featured item (Biryani)
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    res.body.data.forEach((item: any) => expect(item.isFeatured).toBe(true));
  });
});

// ─── POST /menu-items (create) ────────────────────────────────────
describe('POST /menu-items', () => {
  it('401 — unauthenticated create is rejected', async () => {
    const res = await request(app).post(MENU_BASE).send({
      name:         'New Dish',
      price:        150,
      restaurantId,
      category:     catStartersId,
    });
    expect(res.status).toBe(401);
  });

  it('201 — admin can create a menu item', async () => {
    const res = await request(app)
      .post(MENU_BASE)
      .set(authHeader(adminToken))
      .field('name', 'Cheese Naan')
      .field('price', '120')
      .field('restaurantId', restaurantId)
      .field('category', catMainsId);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Cheese Naan');
    expect(res.body.data.price).toBe(120);
    expect(res.body.data.isAvailable).toBe(true);
  });

  it('422 — missing required fields returns validation error', async () => {
    const res = await request(app)
      .post(MENU_BASE)
      .set(authHeader(adminToken))
      .field('name', 'Incomplete Dish');
    // price and category are required

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── PATCH /menu-items/:id/toggle-availability ───────────────────
describe('PATCH /menu-items/:id/toggle-availability', () => {
  it('200 — admin can toggle item availability', async () => {
    const item = await createMenuItem(restaurantId, catMainsId, { isAvailable: true });

    const res = await request(app)
      .patch(`${MENU_BASE}/${item._id}/toggle-availability`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.isAvailable).toBe(false);
  });
});
