import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testStore } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { issuedChallenge } from './testData';

beforeEach(() => {
  installFakeApi({ 'GET /store': { body: { data: testStore } } });
});

async function fillSignup() {
  const user = userEvent.setup();
  await renderApp({ route: '/create-account', seenWelcome: true });
  await user.type(await screen.findByRole('textbox', { name: 'Email address' }), 'new@example.com');
  await user.type(screen.getByLabelText('Password'), 'a-long-secure-password-123');
  await user.click(await screen.findByRole('checkbox', { name: /I agree to the.*Required/ }));
  return user;
}

describe('Laravel email account verification and retry', () => {
  it('creates an account once and displays email OTP verification instead of repeating registration', async () => {
    const api = installFakeApi({
      'GET /store': { body: { data: testStore } },
      'POST /auth/email/register': issuedChallenge,
    });
    const user = await fillSignup();
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeVisible();
    expect(screen.getByLabelText('Six-digit verification code')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Verify email and sign in' })).toBeVisible();
    expect(api.calls().filter((call) => call.path === '/auth/email/register')).toHaveLength(1);
    expect(api.calls().find((call) => call.path === '/auth/email/register')?.body).toMatchObject({
      email: 'new@example.com',
      consents: {
        terms_version: testStore.terms_version,
        privacy_version: testStore.privacy_version,
        marketing: false,
      },
    });
  });

  it('shows a delivery error and allows a safe retry when registration did not complete', async () => {
    let attempts = 0;
    const api = installFakeApi({
      'GET /store': { body: { data: testStore } },
      'POST /auth/email/register': () => {
        attempts += 1;
        return attempts === 1
          ? {
              status: 503,
              body: { code: 'otp_delivery_unavailable', message: 'Email unavailable' },
            }
          : issuedChallenge;
      },
    });
    const user = await fillSignup();
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email verification delivery is unavailable',
    );
    expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveValue('new@example.com');
    expect(api.calls().filter((call) => call.path === '/auth/email/register')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { name: 'Verify your email' })).toBeVisible();
    await waitFor(() => {
      expect(api.calls().filter((call) => call.path === '/auth/email/register')).toHaveLength(2);
    });
  });
});
