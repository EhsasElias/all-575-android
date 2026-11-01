import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { forgetFlow } from './signInMemory';
import { hasConsents, submitCode } from './testActions';
import { consentRequired, issuedChallenge, verifiedLogin } from './testData';

beforeEach(() => {
  forgetFlow();
  vi.stubEnv('VITE_FIREBASE_AUTH_ENABLED', 'true');
});

describe('Create account', () => {
  it.each(['phone', 'email'] as const)(
    'verifies %s and requires legal consent before creating the account',
    async (channel) => {
      const user = userEvent.setup();
      const api = installFakeApi({
        'POST /auth/otp/request': issuedChallenge,
        'POST /auth/otp/verify': ({ body }) =>
          hasConsents(body)
            ? verifiedLogin({ isNewUser: true })
            : consentRequired({ terms: '2026-10-01', privacy: '2026-10-01' }),
      });
      const { router } = await renderApp({
        route: '/create-account?next=%2Faccount',
        seenWelcome: true,
      });
      expect(screen.getByRole('heading', { level: 1, name: 'Create account' })).toBeVisible();
      await user.click(await screen.findByRole('button', { name: 'Use one-time code (OTP)' }));
      if (channel === 'phone')
        await user.click(screen.getByRole('button', { name: 'Use mobile number instead' }));
      const destination = channel === 'email' ? 'sara@example.com' : '0512345678';
      await user.type(
        screen.getByLabelText(channel === 'email' ? 'Email address' : 'Mobile number'),
        destination,
      );
      await user.click(screen.getByRole('button', { name: 'Send code' }));
      await screen.findByLabelText('6-digit code');
      await submitCode(user);
      await screen.findByRole('checkbox', { name: /Terms of Use/ });
      expect(router.state.location.pathname).toBe('/create-account');
      await user.click(screen.getByRole('checkbox', { name: /Terms of Use/ }));
      await user.click(screen.getByRole('checkbox', { name: /Privacy Policy/ }));
      await user.click(screen.getByRole('button', { name: 'Accept and continue' }));
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/account');
      });
      expect(api.calls().find((c) => c.path === '/auth/otp/request')?.body).toEqual({
        channel,
        destination,
      });
      expect(await screen.findByText('Your account is ready. Welcome to ALL 5.75!')).toBeVisible();
    },
  );

  it.each([
    ['ar', 'إنشاء حساب'],
    ['en', 'Create account'],
    ['fr', 'Créer un compte'],
  ] as const)('names registration in %s', async (language, title) => {
    await renderApp({ route: '/create-account', language, seenWelcome: true });
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeVisible();
    expect(document.title).toContain(title);
  });

  it('offers OTP instead of simulated fingerprint on the web', async () => {
    await renderApp({ route: '/sign-in', seenWelcome: true });
    expect(screen.getByText(/Fingerprint is available in the Android app/)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Unlock with fingerprint' }),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Use one-time code (OTP)' })).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Use one-time code (OTP)' }));
    expect(screen.getByRole('button', { name: 'Send code' })).toBeVisible();
  });
});
