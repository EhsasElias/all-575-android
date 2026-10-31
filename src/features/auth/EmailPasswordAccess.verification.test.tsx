import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testStore } from '@/test/fixtures';
import { renderApp } from '@/test/render';

const authMocks = vi.hoisted(() => ({
  create: vi.fn(async () => ({ user: { email: 'new@example.com', emailVerified: false } })),
  signIn: vi.fn(async () => ({ user: { email: 'new@example.com', emailVerified: false } })),
  verify: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  passwordReset: vi.fn(async () => undefined),
  token: vi.fn(async () => 'fake-test-token'),
}));

vi.mock('@/shared/firebase/firebase', () => ({
  getFirebaseAuth: () => ({ currentUser: null, languageCode: 'en' }),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.create,
  signInWithEmailAndPassword: authMocks.signIn,
  sendEmailVerification: authMocks.verify,
  signOut: authMocks.signOut,
  sendPasswordResetEmail: authMocks.passwordReset,
  getIdToken: authMocks.token,
}));

beforeEach(() => {
  vi.stubEnv('VITE_FIREBASE_AUTH_ENABLED', 'true');
  vi.clearAllMocks();
  installFakeApi({ 'GET /store': { body: { data: testStore } } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function fillSignup() {
  const user = userEvent.setup();
  await renderApp({ route: '/create-account', seenWelcome: true });
  await user.type(await screen.findByRole('textbox', { name: 'Email address' }), 'new@example.com');
  await user.type(screen.getByLabelText('Password'), 'a-long-secure-password-123');
  await user.click(await screen.findByRole('checkbox', { name: /I agree to the.*Required/ }));
  return user;
}

describe('email verification delivery and resend', () => {
  it('shows a resend option instead of attempting duplicate account creation', async () => {
    const user = await fillSignup();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByText(/Firebase accepted the verification email request/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Resend verification email' })).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: /I agree to the.*Required/ })).toBeNull();
    expect(authMocks.create).toHaveBeenCalledTimes(1);
    expect(authMocks.verify).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps the resend path when account creation succeeded but email sending failed', async () => {
    authMocks.verify.mockRejectedValueOnce(new Error('mail not accepted'));
    const user = await fillSignup();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('button', { name: 'Resend verification email' })).toBeVisible();
    expect(authMocks.create).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    });
  });
});
