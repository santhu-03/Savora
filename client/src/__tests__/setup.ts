import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Framer Motion ────────────────────────────────────────────────
// Prevents animation side-effects that cause jsdom warnings
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  const React = await vi.importActual<typeof import('react')>('react');

  const noopMotion = (tag: string) =>
    React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement(tag, { ...props, ref }, children)
    );

  return {
    ...actual,
    motion: new Proxy({} as any, {
      get: (_t, prop) => noopMotion(String(prop)),
    }),
    AnimatePresence: ({ children }: any) => children,
    useInView:       () => true,
    useAnimation:    () => ({ start: vi.fn(), set: vi.fn() }),
    useMotionValue:  () => ({ get: () => 0, set: vi.fn() }),
    useTransform:    () => ({ get: () => 0 }),
  };
});

// ─── Socket.io client ─────────────────────────────────────────────
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on:         vi.fn(),
    off:        vi.fn(),
    emit:       vi.fn(),
    connect:    vi.fn(),
    disconnect: vi.fn(),
    connected:  false,
  })),
  io: vi.fn(() => ({
    on:         vi.fn(),
    off:        vi.fn(),
    emit:       vi.fn(),
    connect:    vi.fn(),
    disconnect: vi.fn(),
    connected:  false,
  })),
}));

// ─── Axios ────────────────────────────────────────────────────────
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get:     vi.fn(),
    post:    vi.fn(),
    put:     vi.fn(),
    patch:   vi.fn(),
    delete:  vi.fn(),
    interceptors: {
      request:  { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios, ...mockAxios };
});

// ─── react-hot-toast ──────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
  toast:   { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
  Toaster: () => null,
}));

// ─── localStorage stub (jsdom provides it, zustand needs it) ─────
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear:      () => { store = {}; },
    };
  })(),
  writable: true,
});

// ─── IntersectionObserver stub ────────────────────────────────────
global.IntersectionObserver = class {
  observe    = vi.fn();
  disconnect = vi.fn();
  unobserve  = vi.fn();
} as any;
