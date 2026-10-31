import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testStore } from '@/test/fixtures';
import { renderApp } from '@/test/render';

beforeEach(() => {
  vi.stubEnv('VITE_FIREBASE_AUTH_ENABLED', 'true');
  installFakeApi({ 'GET /store': { body: { data: testStore } } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('feature-gated Firebase email access', () => {
  it('uses email and password first and keeps the existing OTP flow as a choice', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/sign-in', seenWelcome: true });

    expect(await screen.findByRole('textbox', { name: 'Email address' })).toBeVisible();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.queryByLabelText('Mobile number')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use one-time code (OTP)' }));
    expect(await screen.findByLabelText('Mobile number')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Back to email and password' }));
    expect(await screen.findByRole('textbox', { name: 'Email address' })).toBeVisible();
  });

  it('shows clear required legal and optional marketing checkboxes during registration', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/create-account?next=%2Fcheckout', seenWelcome: true });

    const legal = await screen.findByRole('checkbox', { name: /I agree to the.*Required/ });
    const marketing = screen.getByRole('checkbox', { name: /offers and product updates/i });
    expect(legal).not.toBeChecked();
    expect(marketing).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );

    await user.click(marketing);
    expect(marketing).toBeChecked();
    expect(legal).not.toBeChecked();
    await user.click(legal);
    expect(legal).toBeChecked();
  });

  it('keeps both checkboxes visible while legal versions are unavailable', async () => {
    installFakeApi({ 'GET /store': 'offline' });
    await renderApp({ route: '/create-account', seenWelcome: true });

    expect(
      await screen.findByRole('checkbox', { name: /I agree to the.*Required/ }),
    ).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /offers and product updates/i })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });

  it('requires legal acknowledgement before attempting registration', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({ 'GET /store': { body: { data: testStore } } });
    await renderApp({ route: '/create-account', seenWelcome: true });

    await user.type(
      await screen.findByRole('textbox', { name: 'Email address' }),
      'new@example.com',
    );
    await user.type(screen.getByLabelText('Password'), 'long-secure-password-2026');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Accept the Terms of Use and Privacy Policy to create an account.',
    );
    expect(api.requests().filter((request) => request.startsWith('POST /auth'))).toHaveLength(0);
  });
});
