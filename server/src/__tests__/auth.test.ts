// ─── Module mocks — hoisted before all imports ───────────────────
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
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { createTestApp } from './testApp';
import { createUser, getAuthToken } from './factories';

const app = createTestApp();
const BASE = '/api/v1/auth';

// ─── POST /register ───────────────────────────────────────────────
describe('POST /auth/register', () => {
  it('201 — creates user and returns userId', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Secret1234',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeDefined();

    const saved = await User.findOne({ email: 'jane@example.com' });
    expect(saved).not.toBeNull();
    expect(saved!.isVerified).toBe(false);   // must verify email first
    expect(saved!.password).not.toBe('Secret1234'); // hashed
  });

  it('409 — duplicate email returns EMAIL_EXISTS', async () => {
    await User.create({ name: 'Existing', email: 'dup@example.com', password: 'Password1', isVerified: true });

    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Another',
      email: 'dup@example.com',
      password: 'Password1',
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  it('422 — password without uppercase is rejected', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Test',
      email: 'weak1@example.com',
      password: 'alllowercase1',
    });
    expect(res.status).toBe(422);
  });

  it('422 — password without number is rejected', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Test',
      email: 'weak2@example.com',
      password: 'NoNumbers!',
    });
    expect(res.status).toBe(422);
  });

  it('422 — short password is rejected', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      name: 'Test',
      email: 'weak3@example.com',
      password: 'P1',
    });
    expect(res.status).toBe(422);
  });

  it('422 — missing name is rejected', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: 'no-name@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(422);
  });
});

// ─── POST /login ──────────────────────────────────────────────────
describe('POST /auth/login', () => {
  const EMAIL = 'login@example.com';
  const PASS  = 'Password1';

  beforeEach(async () => {
    await createUser({ email: EMAIL, password: PASS, isVerified: true });
  });

  it('200 — correct credentials returns accessToken + sets refresh cookie', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: EMAIL, password: PASS });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(EMAIL);
    expect(res.body.data.user.password).toBeUndefined(); // scrubbed by toJSON

    const raw = res.headers['set-cookie'] ?? [];
    const cookies: string[] = Array.isArray(raw) ? raw : [raw];
    expect(cookies.some((c: string) => c.startsWith('savora_refresh='))).toBe(true);
  });

  it('401 — wrong password returns INVALID_CREDENTIALS', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: EMAIL, password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('401 — unknown email returns INVALID_CREDENTIALS (no user enumeration)', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'ghost@example.com', password: PASS });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('403 — unverified email returns EMAIL_NOT_VERIFIED', async () => {
    await createUser({ email: 'unverified@example.com', password: PASS, isVerified: false });

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'unverified@example.com', password: PASS });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('422 — missing email returns validation error', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ password: PASS });
    expect(res.status).toBe(422);
  });
});

// ─── POST /refresh ────────────────────────────────────────────────
describe('POST /auth/refresh', () => {
  const EMAIL = 'refresh@example.com';
  const PASS  = 'Password1';

  it('200 — valid refresh cookie issues new accessToken', async () => {
    await createUser({ email: EMAIL, password: PASS, isVerified: true });

    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: EMAIL, password: PASS });

    const rawLogin = loginRes.headers['set-cookie'] ?? [];
    const cookies: string[] = Array.isArray(rawLogin) ? rawLogin : [rawLogin];

    const refreshRes = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    // A new refresh cookie should be rotated in
    const rawRefresh = refreshRes.headers['set-cookie'] ?? [];
    const newCookies: string[] = Array.isArray(rawRefresh) ? rawRefresh : [rawRefresh];
    expect(newCookies.some((c: string) => c.startsWith('savora_refresh='))).toBe(true);
  });

  it('401 — no cookie returns NO_TOKEN', async () => {
    const res = await request(app).post(`${BASE}/refresh`);
    expect(res.status).toBe(401);
  });

  it('401 — expired refresh token is rejected', async () => {
    // Craft a JWT with exp in the past
    const expiredToken = jwt.sign(
      { userId: '000000000000000000000001', exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_REFRESH_SECRET!
    );

    const res = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', `savora_refresh=${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('401 — forged / invalid token is rejected', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', 'savora_refresh=not.a.valid.jwt');

    expect(res.status).toBe(401);
  });
});

// ─── GET /me ─────────────────────────────────────────────────────
describe('GET /auth/me', () => {
  it('200 — returns current user with valid Bearer token', async () => {
    const user = await createUser({ name: 'Me Test' });
    const token = getAuthToken(user);

    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(user._id.toString());
    expect(res.body.data.user.name).toBe('Me Test');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('401 — missing token returns 401', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });

  it('401 — malformed Bearer token returns 401', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });

  it('401 — expired access token returns TOKEN_EXPIRED', async () => {
    const expiredToken = jwt.sign(
      { userId: '000000000000000000000001', role: 'customer', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET!
    );

    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });
});
