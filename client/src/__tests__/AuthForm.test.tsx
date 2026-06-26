import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock useAuth so the form can call login() without an API ────
const mockLogin    = vi.fn();
const mockRegister = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login:           mockLogin,
    register:        mockRegister,
    isAuthenticated: false,
    isLoading:       false,
    user:            null,
  }),
  AuthProvider: ({ children }: any) => children,
}));

// ─── Mock react-router navigate ───────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import Login    from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Register />
    </MemoryRouter>
  );
}

// ─── Login form ───────────────────────────────────────────────────
describe('Login form', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('shows validation error when email is empty on submit', async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email format', async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password is too short', async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), '12345'); // < 6 chars
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login() with correct credentials on valid submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'john@example.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'correctpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'correctpassword');
    });
  });

  it('displays server error message when login() throws', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'bad@example.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const user = userEvent.setup();
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find the toggle button (eye icon area)
    const toggleBtn = screen.getByRole('button', { name: '' }); // icon button has no text
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

// ─── Register form ────────────────────────────────────────────────
describe('Register form', () => {
  beforeEach(() => {
    mockRegister.mockReset();
  });

  it('renders name, email, password, and confirm password fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    // At least one password field
    const passwordFields = screen.getAllByPlaceholderText(/••••••••/i);
    expect(passwordFields.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error for missing name on submit', async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      // Some name-related validation message
      expect(screen.getByText(/name/i)).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error for invalid email', async () => {
    renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'notanemail');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('calls register() with valid data', async () => {
    mockRegister.mockResolvedValue(undefined);
    renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/your name/i), 'Jane Doe');
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'jane@example.com');

    const passwordFields = screen.getAllByPlaceholderText(/••••••••/i);
    await user.type(passwordFields[0], 'Secure1234');
    if (passwordFields[1]) {
      await user.type(passwordFields[1], 'Secure1234');
    }

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com' })
      );
    });
  });
});
