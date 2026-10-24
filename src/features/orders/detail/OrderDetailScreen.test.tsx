import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID, buildItem, buildOrderDetail, buildRefund, buildSuborder } from '../testData';
import { cancelledOrder, onTheWayOrder, pendingPaymentOrder } from '../testScenarios';
import { orderRoutes, region } from '../testHelpers';
import type { OrderDetail } from '../types';

const signedIn = { 'GET /me': { body: { data: testUser } } };

function openOrder(order: OrderDetail, language: 'en' | 'ar' = 'en') {
  installFakeApi({ ...signedIn, ...orderRoutes(order) });
  return renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true, language });
}

describe('Order detail: header and the three dates', () => {
  it('shows the number, the status and order, payment and refund dates apart', async () => {
    const refund = buildRefund({
      status: 'succeeded',
      completed_at: '2026-10-27T09:00:00.000000Z',
    });
    await openOrder(cancelledOrder([refund]));

    const heading = await screen.findByRole('heading', { level: 1, name: 'Order A575-IICOU1LN' });
    const header = heading.closest('header');
    expect(header).not.toBeNull();
    const scope = within(header ?? document.body);
    expect(scope.getByText('Cancelled')).toBeInTheDocument();
    expect(scope.getByText('Order date').nextElementSibling).toHaveTextContent(
      '24 Oct 2026, 8:18 pm',
    );
    expect(scope.getByText('Payment date').nextElementSibling).toHaveTextContent(
      '24 Oct 2026, 8:20 pm',
    );
    expect(scope.getByText('Refund date').nextElementSibling).toHaveTextContent(
      '27 Oct 2026, 12:00 pm',
    );
  });

  it('says an unpaid order is not paid yet and points to the payment screen', async () => {
    await openOrder(pendingPaymentOrder());

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(
      within(heading.closest('header') ?? document.body).getByText('Awaiting payment'),
    ).toBeInTheDocument();
    expect(screen.getByText('Payment date').nextElementSibling).toHaveTextContent('Not paid yet');
    expect(
      screen.getByText(/Pay before 24 Oct 2026, 8:33 pm to keep your items\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Complete payment' })).toHaveAttribute(
      'href',
      `/checkout/payment/${ORDER_ID}`,
    );
  });

  it('shows no refund date when there is no refund', async () => {
    await openOrder(buildOrderDetail());

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Refund date')).not.toBeInTheDocument();
  });
});
describe('Order detail: deliveries', () => {
  it('shows a confirmed order with its seller delivery, items and totals', async () => {
    await openOrder(
      buildOrderDetail({
        suborders: [
          buildSuborder({
            items: [
              buildItem({
                variant_name: { ar: 'أزرق', en: 'Blue' },
                quantity: 2,
                unit_price: 575,
                line_total: 1150,
              }),
            ],
          }),
        ],
      }),
    );

    const delivery = within(await screen.findByRole('article', { name: 'From Value Store' }));
    expect(delivery.getByText('Waiting for the seller')).toBeInTheDocument();
    expect(delivery.getByText('Cleaning Brush')).toBeInTheDocument();
    expect(delivery.getByText('Blue')).toBeInTheDocument();
    expect(delivery.getByText(/2 × 5\.75\s+SAR/)).toBeInTheDocument();
    expect(delivery.getByText(/^11\.50\s+SAR$/)).toBeInTheDocument();
    expect(delivery.getByRole('list', { name: 'Delivery progress' })).toBeInTheDocument();
    expect(delivery.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('explains that several sellers deliver separately, each with its own status', async () => {
    await openOrder(
      buildOrderDetail({
        suborders: [
          buildSuborder({ id: 'sub-a', status: 'preparing' }),
          buildSuborder({
            id: 'sub-b',
            status: 'on_the_way',
            seller: { slug: 'fresh', name: { ar: 'طازج', en: 'Fresh Market' }, logo_url: null },
            items: [buildItem({ product_slug: 'apples', name: { ar: 'تفاح', en: 'Apples' } })],
          }),
        ],
      }),
    );

    expect(await screen.findByText(/Each seller delivers on their own/)).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'From Value Store' })).getByText('Being prepared'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'From Fresh Market' })).getByText('On the way'),
    ).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
  });

  it('shows the expected time and why it changed', async () => {
    await openOrder(onTheWayOrder());

    const delivery = within(await screen.findByRole('article', { name: 'From Value Store' }));
    expect(delivery.getByText(/Expected 25 Oct 2026, 10:30 am/)).toBeInTheDocument();
    expect(
      delivery.getByText('The time changed: Heavy traffic on King Fahd Road'),
    ).toBeInTheDocument();
  });

  it('shows the timeline from the API with the reason for a revised time', async () => {
    await openOrder(onTheWayOrder());

    await screen.findByRole('region', { name: 'Order timeline' });
    const timeline = region('Order timeline');
    expect(timeline.getByText('Order placed')).toBeInTheDocument();
    expect(timeline.getByText('Order confirmed')).toBeInTheDocument();
    expect(timeline.getByText('Being prepared')).toBeInTheDocument();
    expect(timeline.getByText('On the way to you')).toBeInTheDocument();
    expect(timeline.getByText('Delivery time updated')).toBeInTheDocument();
    expect(timeline.getByText('Reason: Heavy traffic on King Fahd Road')).toBeInTheDocument();
  });

  it('never prints a timeline event type it does not know', async () => {
    await openOrder(
      buildOrderDetail({
        timeline: [
          {
            type: 'internal_audit_note',
            at: '2026-10-24T17:18:04Z',
            suborder_id: null,
            note: 'secret',
          },
        ],
      }),
    );

    await screen.findByRole('region', { name: 'Order timeline' });
    const timeline = region('Order timeline');
    expect(timeline.getByText('Order update')).toBeInTheDocument();
    expect(screen.queryByText('internal_audit_note')).not.toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});
describe('Order detail: address, slot, payment and totals', () => {
  it('shows the address snapshot and the slot in Saudi time', async () => {
    await openOrder(buildOrderDetail());

    const shipping = await screen.findByRole('region', { name: 'Delivery details' });
    const scope = within(shipping);
    expect(scope.getByText('Order Tester')).toBeInTheDocument();
    expect(scope.getByText('8228 King Fahd Road')).toBeInTheDocument();
    expect(scope.getByText('Al Olaya, Riyadh')).toBeInTheDocument();
    expect(scope.getByText('Riyadh Region 12611')).toBeInTheDocument();
    expect(scope.getByText('RRRD2929')).toBeInTheDocument();
    expect(scope.getByText('Delivery slot').nextElementSibling).toHaveTextContent(
      /25 Oct 2026, 9:00 – 11:00\s?am/,
    );
  });

  it('shows the payment method and status', async () => {
    await openOrder(buildOrderDetail());

    const payment = within(await screen.findByRole('region', { name: 'Payment and refunds' }));
    expect(payment.getByText('mada')).toBeInTheDocument();
    expect(payment.getByText('Paid')).toBeInTheDocument();
    expect(payment.getByText('Paid on 24 Oct 2026, 8:20 pm')).toBeInTheDocument();
  });

  it('shows the totals with VAT included and free delivery as free', async () => {
    const order = buildOrderDetail();
    await openOrder({
      ...order,
      promo_code: 'WELCOME',
      amounts: { ...order.amounts, discount: 200, delivery_fee: 0, total: 1950 },
    });

    const totals = within(await screen.findByRole('region', { name: 'Summary' }));
    expect(totals.getByText('Items').nextElementSibling).toHaveTextContent(/^11\.50\s+SAR$/);
    expect(totals.getByText('Discount (WELCOME)').nextElementSibling).toHaveTextContent(
      /− 2\.00\s+SAR/,
    );
    expect(totals.getByText('Delivery').nextElementSibling).toHaveTextContent('Free');
    expect(totals.getByText('Total').nextElementSibling).toHaveTextContent(/^19\.50\s+SAR$/);
    expect(totals.getByText('VAT included').nextElementSibling).toHaveTextContent(/^2\.80\s+SAR$/);
    expect(totals.getByText('All prices include VAT.')).toBeInTheDocument();
  });
});
