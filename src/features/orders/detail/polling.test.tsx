import { act, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID, buildOrderDetail, buildRefund, buildSuborder } from '../testData';
import { cancelledOrder, deliveredOrder } from '../testScenarios';
import type { OrderDetail } from '../types';
import { ORDER_POLL_INTERVAL_MS } from './useOrder';

afterEach(() => {
  vi.useRealTimers();
});

/** Serves the given versions of the order one after another; the last one repeats. */
async function openChangingOrder(versions: OrderDetail[]) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  let served = 0;
  const api = installFakeApi({
    'GET /me': { body: { data: testUser } },
    'GET /orders/:id': () => {
      const order = versions[Math.min(served, versions.length - 1)];
      served += 1;
      return { body: { data: order } };
    },
  });
  await renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true });
  await screen.findByRole('heading', { level: 1 });
  return {
    orderRequests: () =>
      api.requests().filter((request) => request === `GET /orders/${ORDER_ID}`).length,
  };
}

async function wait(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('The order page refreshes by itself while the order is active', () => {
  it('asks again every 15 seconds and shows the new status without a reload', async () => {
    const waiting = buildOrderDetail();
    const preparing = buildOrderDetail({ suborders: [buildSuborder({ status: 'preparing' })] });
    const { orderRequests } = await openChangingOrder([waiting, preparing]);
    const delivery = () => within(screen.getByRole('article', { name: 'From Value Store' }));
    expect(delivery().getByText('Waiting for the seller')).toBeInTheDocument();
    expect(orderRequests()).toBe(1);

    await wait(ORDER_POLL_INTERVAL_MS - 1000);
    expect(orderRequests()).toBe(1);
    await wait(1500);

    expect(orderRequests()).toBe(2);
    expect(await screen.findByText('Being prepared', { selector: 'span' })).toBeInTheDocument();
    expect(delivery().queryByText('Waiting for the seller')).not.toBeInTheDocument();
  });

  it('stops once the order reaches a final state', async () => {
    const { orderRequests } = await openChangingOrder([buildOrderDetail(), deliveredOrder()]);

    await wait(ORDER_POLL_INTERVAL_MS + 500);
    expect(orderRequests()).toBe(2);
    expect(await screen.findByText('Completed')).toBeInTheDocument();

    await wait(ORDER_POLL_INTERVAL_MS * 4);
    expect(orderRequests()).toBe(2);
  });

  it('does not poll a cancelled order, even with a refund still in progress', async () => {
    const { orderRequests } = await openChangingOrder([cancelledOrder([buildRefund()])]);

    await wait(ORDER_POLL_INTERVAL_MS * 3);

    expect(orderRequests()).toBe(1);
  });

  it('pauses while the tab is hidden and resumes when it is visible again', async () => {
    const { orderRequests } = await openChangingOrder([buildOrderDetail()]);
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    await wait(ORDER_POLL_INTERVAL_MS * 3);
    expect(orderRequests()).toBe(1);

    visibility.mockReturnValue('visible');
    await wait(ORDER_POLL_INTERVAL_MS + 500);
    expect(orderRequests()).toBeGreaterThan(1);
  });

  it('tells the customer the page updates on its own, but only while it can change', async () => {
    await openChangingOrder([buildOrderDetail()]);
    expect(screen.getByText(/updates by itself/)).toBeInTheDocument();
  });

  it('does not say so for a finished order', async () => {
    await openChangingOrder([deliveredOrder()]);
    expect(screen.queryByText(/updates by itself/)).not.toBeInTheDocument();
  });
});
