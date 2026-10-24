import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID, buildOrderDetail, buildRefund } from '../testData';
import { cancelledOrder, pendingPaymentOrder } from '../testScenarios';

const signedIn = { 'GET /me': { body: { data: testUser } } };

function openOrder(language: 'en' | 'ar' = 'en') {
  return renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true, language });
}

describe('Cancel an order', () => {
  it('explains the refund before cancelling a paid order, then cancels and shows the pending refund', async () => {
    const user = userEvent.setup();
    const paid = buildOrderDetail();
    const cancelled = cancelledOrder([buildRefund({ status: 'pending' })]);
    let current = paid;
    const api = installFakeApi({
      ...signedIn,
      'GET /orders/:id': () => ({ body: { data: current } }),
      'POST /orders/:id/cancel': () => {
        current = cancelled;
        return { body: { data: cancelled } };
      },
    });
    await openOrder();

    await user.click(await screen.findByRole('button', { name: 'Cancel order' }));

    const sheet = within(screen.getByRole('dialog', { name: 'Cancel this order?' }));
    expect(sheet.getByText(/full 21\.50\s+SAR you paid/)).toBeInTheDocument();
    expect(
      sheet.getByText(/"In progress" until your payment provider confirms it/),
    ).toBeInTheDocument();
    expect(api.requests()).not.toContain(`POST /orders/${ORDER_ID}/cancel`);

    await user.click(sheet.getByRole('button', { name: 'Yes, cancel my order' }));

    expect(await screen.findByText('Your order was cancelled.')).toBeInTheDocument();
    expect(api.requests()).toContain(`POST /orders/${ORDER_ID}/cancel`);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
    const header = screen.getByRole('heading', { level: 1 }).closest('header');
    expect(within(header ?? document.body).getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('In progress', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('Refunded')).not.toBeInTheDocument();
    // Focus goes to the page title, not to a button that no longer exists.
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('tells an unpaid order that nothing will be charged', async () => {
    const user = userEvent.setup();
    installFakeApi({ ...signedIn, 'GET /orders/:id': { body: { data: pendingPaymentOrder() } } });
    await openOrder();

    await user.click(await screen.findByRole('button', { name: 'Cancel order' }));

    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByText(/nothing will be charged/)).toBeInTheDocument();
    expect(sheet.queryByText(/refund/i)).not.toBeInTheDocument();
  });

  it('keeps the order when the customer changes their mind', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: buildOrderDetail() } },
    });
    await openOrder();

    await user.click(await screen.findByRole('button', { name: 'Cancel order' }));
    await user.click(screen.getByRole('button', { name: 'Keep my order' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requests().filter((request) => request.startsWith('POST'))).toEqual([]);
  });

  it('offers no cancel button once the seller started preparing, and says why', async () => {
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: buildOrderDetail({ can_cancel: false }) } },
    });
    await openOrder();

    expect(await screen.findByText(/can no longer be cancelled here/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });

  it('handles order_not_cancellable: explains it, reloads the order and drops the button', async () => {
    const user = userEvent.setup();
    let preparing = false;
    const api = installFakeApi({
      ...signedIn,
      'GET /orders/:id': () => ({ body: { data: buildOrderDetail({ can_cancel: !preparing }) } }),
      'POST /orders/:id/cancel': () => {
        preparing = true;
        return {
          status: 409,
          body: { message: 'This order is already being prepared.', code: 'order_not_cancellable' },
        };
      },
    });
    await openOrder();

    await user.click(await screen.findByRole('button', { name: 'Cancel order' }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel my order' }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'This order is already being prepared, so it can no longer be cancelled here.',
    );
    // Raw server text is never shown.
    expect(screen.queryByText('This order is already being prepared.')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        within(dialog).queryByRole('button', { name: 'Yes, cancel my order' }),
      ).not.toBeInTheDocument();
    });
    // The sheet's own close icon and the footer button are both there.
    const closers = within(dialog).getAllByRole('button', { name: 'Close' });
    expect(closers).toHaveLength(2);
    expect(
      api.requests().filter((request) => request === `GET /orders/${ORDER_ID}`).length,
    ).toBeGreaterThan(1);

    await user.click(closers[1] ?? document.body);

    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
    expect(screen.getByText(/can no longer be cancelled here/)).toBeInTheDocument();
  });

  it('shows a general message and allows another try when the request fails', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: buildOrderDetail() } },
      'POST /orders/:id/cancel': { status: 500, body: { message: 'Server exploded' } },
    });
    await openOrder();

    await user.click(await screen.findByRole('button', { name: 'Cancel order' }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel my order' }));

    expect(await screen.findByText(/We could not cancel the order/)).toBeInTheDocument();
    expect(screen.queryByText('Server exploded')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, cancel my order' })).toBeInTheDocument();
  });

  it('works in Arabic', async () => {
    const user = userEvent.setup();
    installFakeApi({ ...signedIn, 'GET /orders/:id': { body: { data: buildOrderDetail() } } });
    await openOrder('ar');

    await user.click(await screen.findByRole('button', { name: 'إلغاء الطلب' }));

    const sheet = within(screen.getByRole('dialog', { name: 'هل تريد إلغاء هذا الطلب؟' }));
    expect(sheet.getByText(/21\.50\s+ر\.س/)).toBeInTheDocument();
    expect(sheet.getByRole('button', { name: 'نعم، ألغِ طلبي' })).toBeInTheDocument();
  });
});
