import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { accountLocales } from './locales';
import type { CustomerDashboard } from './useCustomerDashboard';

const summary: CustomerDashboard = {
  orders_total: 4,
  orders_active: 1,
  orders_awaiting_payment: 1,
  orders_completed: 2,
  paid_total: 3000,
  refunded_total: 500,
  net_spent: 2500,
  currency: 'SAR',
  generated_at: '2026-10-29T10:00:00Z',
  saved_products: 2,
  addresses: 1,
  open_support: 1,
  open_requests: 0,
  recent_orders: [
    {
      id: 'test-order-1',
      number: 'A575-DASHBOARD',
      status: 'pending_payment',
      placed_at: '2026-10-29T09:00:00Z',
      paid_at: null,
      total: 575,
      currency: 'SAR',
      items_count: 1,
      preview_images: [],
      slot: { starts_at: null, ends_at: null },
      payment_status: 'pending',
    },
  ],
};
const signedIn = { 'GET /me': { body: { data: testUser } } };

describe('Customer dashboard', () => {
  it.each(['en', 'ar', 'fr'] as const)(
    'shows real server totals, filtered links and journey in %s',
    async (language) => {
      installFakeApi({ ...signedIn, 'GET /me/dashboard': { body: { data: summary } } });
      await renderApp({ route: '/account/dashboard', signedIn: true, seenWelcome: true, language });
      const text = accountLocales[language].dashboard;
      expect(await screen.findByRole('heading', { level: 1, name: text.title })).toBeVisible();
      const totals = await screen.findByRole('region', { name: text.allTime });
      expect(within(totals).getByRole('link', { name: new RegExp(text.active) })).toHaveAttribute(
        'href',
        '/orders?status=confirmed',
      );
      expect(within(totals).getByRole('link', { name: new RegExp(text.awaiting) })).toHaveAttribute(
        'href',
        '/orders?status=pending_payment',
      );
      expect(within(totals).getByText(/25[.,]00/)).toBeVisible();
      expect(screen.getByText(text.cashHint)).toBeVisible();
      expect(screen.getByRole('link', { name: new RegExp('A575-DASHBOARD') })).toHaveAttribute(
        'href',
        '/orders/test-order-1',
      );
      const journey = screen.getByRole('region', { name: text.journey });
      expect(within(journey).getAllByRole('link')).toHaveLength(6);
      expect(
        within(journey).getByRole('link', { name: new RegExp(text.checkout) }),
      ).toHaveAttribute('href', '/checkout');
      expect(screen.getByText(/13:00|1:00/)).toBeVisible();
    },
  );

  it('gives a new customer useful empty actions without invented orders', async () => {
    installFakeApi({
      ...signedIn,
      'GET /me/dashboard': {
        body: {
          data: {
            ...summary,
            orders_total: 0,
            orders_active: 0,
            orders_awaiting_payment: 0,
            orders_completed: 0,
            paid_total: 0,
            refunded_total: 0,
            net_spent: 0,
            recent_orders: [],
          },
        },
      },
    });
    await renderApp({ route: '/account/dashboard', signedIn: true, seenWelcome: true });
    expect(
      await screen.findByRole('heading', { name: 'Your first order starts here' }),
    ).toBeVisible();
    expect(screen.queryByText(/A575-/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your shopping steps' })).toBeVisible();
  });

  it('shows lookup failure with retry and then refreshes the actual totals', async () => {
    let requests = 0;
    installFakeApi({
      ...signedIn,
      'GET /me/dashboard': () => (++requests <= 2 ? 'offline' : { body: { data: summary } }),
    });
    const user = userEvent.setup();
    await renderApp({ route: '/account/dashboard', signedIn: true, seenWelcome: true });
    expect(
      await screen.findByRole(
        'heading',
        { name: 'We could not load your dashboard' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.queryByText('Net paid spending')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Net paid spending')).toBeVisible();
  });

  it('requires sign-in and preserves the dashboard destination', async () => {
    installFakeApi({});
    const { router } = await renderApp({ route: '/account/dashboard', seenWelcome: true });
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe(
      '/account/dashboard',
    );
  });
});
