import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ordersPage } from '../testData';

describe('Own order filters', () => {
  it('uses dashboard status links, then combines order number and dates and clears them', async () => {
    const api = installFakeApi({
      'GET /me': { body: { data: testUser } },
      'GET /orders': { body: ordersPage([]) },
    });
    const user = userEvent.setup();
    const { router } = await renderApp({
      route: '/orders?status=pending_payment',
      signedIn: true,
      seenWelcome: true,
    });
    expect(await screen.findByRole('heading', { name: 'No matching orders' })).toBeVisible();
    await user.click(screen.getByText('Filter orders'));
    expect(screen.getByLabelText('Order status')).toHaveValue('pending_payment');
    await user.type(screen.getByLabelText('Order number'), 'A575-TEST');
    await user.selectOptions(screen.getByLabelText('Period'), 'custom');
    await user.type(screen.getByLabelText('From'), '2026-10-01');
    await user.type(screen.getByLabelText('To'), '2026-10-29');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => {
      const query = api
        .calls()
        .filter((call) => call.path === '/orders')
        .at(-1)?.query;
      expect(query?.get('status')).toBe('pending_payment');
      expect(query?.get('q')).toBe('A575-TEST');
      expect(query?.get('from')).toBe('2026-10-01');
      expect(query?.get('to')).toBe('2026-10-29');
    });
    await user.click(
      screen.getAllByRole('button', { name: 'Clear filters' })[0] ??
        screen.getByRole('button', { name: 'Apply filters' }),
    );
    expect(router.state.location.search).toBe('');
    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeVisible();
  });

  it('does not apply an end date before the beginning', async () => {
    installFakeApi({
      'GET /me': { body: { data: testUser } },
      'GET /orders': { body: ordersPage([]) },
    });
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/orders', signedIn: true, seenWelcome: true });
    await user.click(screen.getByText('Filter orders'));
    await user.selectOptions(screen.getByLabelText('Period'), 'custom');
    await user.type(screen.getByLabelText('From'), '2026-10-29');
    await user.type(screen.getByLabelText('To'), '2026-10-01');
    expect(screen.getByRole('button', { name: 'Apply filters' })).toBeDisabled();
    expect(router.state.location.search).toBe('');
  });
});
