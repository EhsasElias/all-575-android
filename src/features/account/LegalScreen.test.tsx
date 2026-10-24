import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { testStore } from './testData';

const storeWith = (terms: string, privacy: string) => ({
  'GET /store': {
    body: { data: { ...testStore, terms_version: terms, privacy_version: privacy } },
  },
});

describe('Legal pages', () => {
  it('shows the Terms with the current version and says the full text is pending', async () => {
    installFakeApi(storeWith('2026-10-01', '2026-10-05'));
    await renderApp({ route: '/legal/terms', seenWelcome: true });

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument();
    expect(await screen.findByText('Version 2026-10-01')).toBeVisible();
    const notice = screen.getByRole('note', { name: 'The full text is coming soon' });
    expect(within(notice).getByText(/waiting for legal review/)).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'What this document will cover' }),
    ).toBeVisible();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(5);
    expect(document.title).toBe('Terms of Use · ALL 5.75');
  });

  it('shows the Privacy Policy with its own version', async () => {
    installFakeApi(storeWith('2026-10-01', '2026-10-05'));
    await renderApp({ route: '/legal/privacy', seenWelcome: true });

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(await screen.findByText('Version 2026-10-05')).toBeVisible();
    expect(screen.getByText('What personal data we collect')).toBeVisible();
    expect(document.title).toBe('Privacy Policy · ALL 5.75');
  });

  it('needs no sign-in', async () => {
    installFakeApi(storeWith('2026-10-01', '2026-10-01'));
    const { router } = await renderApp({ route: '/legal/privacy', seenWelcome: true });

    expect(router.state.location.pathname).toBe('/legal/privacy');
    expect(screen.queryByLabelText('Mobile number')).not.toBeInTheDocument();
  });

  it('reads right to left in Arabic', async () => {
    installFakeApi(storeWith('2026-10-01', '2026-10-05'));
    await renderApp({ route: '/legal/terms', seenWelcome: true, language: 'ar' });

    expect(screen.getByRole('heading', { level: 1, name: 'شروط الاستخدام' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(await screen.findByText('الإصدار 2026-10-01')).toBeVisible();
    expect(screen.getByRole('note', { name: 'النص الكامل قريبًا' })).toBeVisible();
    expect(screen.queryByText('Terms of Use')).not.toBeInTheDocument();
  });

  it('still shows the page when the version cannot be loaded, and loads it on retry', async () => {
    const user = userEvent.setup();
    let working = false;
    installFakeApi({
      'GET /store': () => (working ? { body: { data: testStore } } : { status: 500, body: {} }),
    });
    await renderApp({ route: '/legal/terms', seenWelcome: true });

    expect(
      await screen.findByText('The current version could not be loaded.', {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible();
    working = true;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Version 2026-10-01')).toBeVisible();
  });

  it('goes back to where the customer came from', async () => {
    const user = userEvent.setup();
    installFakeApi(storeWith('2026-10-01', '2026-10-01'));
    const { router } = await renderApp({ route: '/account', seenWelcome: true });

    await user.click(screen.getByRole('link', { name: 'Terms of Use' }));
    expect(router.state.location.pathname).toBe('/legal/terms');
    await user.click(await screen.findByRole('button', { name: 'Back' }));

    expect(router.state.location.pathname).toBe('/account');
  });

  it('offers a link to the account when opened directly', async () => {
    installFakeApi(storeWith('2026-10-01', '2026-10-01'));
    await renderApp({ route: '/legal/terms', seenWelcome: true });

    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/account');
  });
});
