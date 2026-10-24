import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatMoney } from '@/shared/i18n';
import { renderCheckout } from './checkoutHarness';
import { jeddah, quote, TOTAL_TEXT } from './testData';

describe('Checkout: what the customer sees', () => {
  it('shows the address, delivery time and itemized summary for a signed-in customer with a one-line cart and a default address', async () => {
    const { api } = await renderCheckout();

    expect(await screen.findByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible();
    // It must not fall back to the empty-cart screen.
    expect(screen.queryByText('Nothing to check out yet')).not.toBeInTheDocument();

    // (a) address: the default is chosen already.
    const addresses = screen.getByRole('radiogroup', { name: 'Delivery address' });
    expect(within(addresses).getByRole('radio', { name: /Home/ })).toBeChecked();
    expect(within(addresses).getByRole('radio', { name: /Work/ })).not.toBeChecked();
    expect(within(addresses).getByText('Default')).toBeVisible();

    // (b) delivery times, grouped by Saudi day.
    expect(await screen.findByRole('group', { name: 'Sunday, October 25' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Monday, October 26' })).toBeVisible();
    const sunday = screen.getByRole('group', { name: 'Sunday, October 25' });
    expect(within(sunday).getByRole('radio', { name: '9:00 AM – 11:00 AM' })).toBeEnabled();
    const full = screen.getByRole('radio', { name: /11:00 AM – 1:00 PM/ });
    expect(full).toBeDisabled();
    expect(within(full.closest('label') ?? document.body).getByText('Full')).toBeVisible();
    expect(screen.getByRole('radio', { name: '9:00 PM – 11:00 PM' })).toBeEnabled();

    // (c) the server's itemized price.
    const summary = await screen.findByRole('region', { name: 'Order summary' });
    expect(within(summary).getByText('Biscuits')).toBeVisible();
    expect(within(summary).getByText('Quantity: 2')).toBeVisible();
    // The line and the subtotal.
    expect(within(summary).getAllByText('11.50 SAR')).toHaveLength(2);
    expect(within(summary).getByText('10.00 SAR')).toBeVisible();
    expect(within(summary).getByText('2.80 SAR')).toBeVisible();
    expect(
      within(summary).getByText(/Free delivery on orders of 50\.00 SAR or more/),
    ).toBeVisible();
    expect(within(summary).getByText(/^21\.50\s+SAR$/)).toBeVisible();
    expect(within(summary).getByText(/Prices are held until/)).toBeVisible();

    // (d) payment methods as radio cards.
    const methods = screen.getByRole('radiogroup', { name: 'Payment method' });
    expect(
      within(methods)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['mada', 'card', 'apple_pay']);
    expect(within(methods).getByRole('radio', { name: /mada/ })).toBeChecked();

    // The pay button carries the same total, and waits for a delivery time.
    const pay = screen.getByRole('button', { name: `Pay ${TOTAL_TEXT}` });
    expect(pay).toBeDisabled();
    expect(pay).toHaveAccessibleDescription('Choose a delivery time to continue.');

    expect(api.requests()).toContain('GET /cart');
    expect(
      api
        .calls()
        .find((call) => call.path === '/delivery/slots')
        ?.query.get('address_id'),
    ).toBe('1');
    expect(api.calls().find((call) => call.path === '/quotes')?.body).toEqual({ address_id: 1 });
  });

  it('prices the order for the address that is chosen, and asks again when another one is picked', async () => {
    const { api } = await renderCheckout();
    const user = (await import('@testing-library/user-event')).default.setup();

    await screen.findByRole('region', { name: 'Order summary' });
    await user.click(screen.getByRole('radio', { name: /Work/ }));

    await screen.findByRole('radio', { name: /Work/, checked: true });
    const quoted = api
      .calls()
      .filter((call) => call.path === '/quotes')
      .map((call) => call.body);
    expect(quoted).toContainEqual({ address_id: 3 });
    expect(
      api
        .calls()
        .filter((call) => call.path === '/delivery/slots')
        .map((call) => call.query.get('address_id')),
    ).toContain('3');
  });

  it('disables an address we do not deliver to, says why, and offers to fix the pin', async () => {
    await renderCheckout();

    const radio = await screen.findByRole('radio', { name: /Jeddah flat/ });
    expect(radio).toBeDisabled();
    expect(screen.getByText('We do not deliver here yet')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Edit the pin' })).toHaveAttribute(
      'href',
      '/account/addresses/2',
    );
    expect(screen.getByRole('link', { name: 'Add address' })).toHaveAttribute(
      'href',
      '/account/addresses/new?next=%2Fcheckout',
    );
  });

  it('chooses the first deliverable address when the default is not deliverable', async () => {
    const { api } = await renderCheckout({
      routes: {
        'GET /addresses': {
          body: {
            data: [
              { ...jeddah, is_default: true },
              { ...jeddah, id: 5, label: 'Office', serviceable: true, is_default: false },
            ],
          },
        },
      },
    });

    expect(await screen.findByRole('radio', { name: /Office/, checked: true })).toBeVisible();
    expect(api.calls().find((call) => call.path === '/quotes')?.body).toEqual({ address_id: 5 });
  });

  it('asks for an address when none can be delivered to, and does not price anything', async () => {
    const { api } = await renderCheckout({
      routes: { 'GET /addresses': { body: { data: [jeddah] } } },
    });

    expect(await screen.findByText(/We do not deliver to any of your addresses yet/)).toBeVisible();
    expect(screen.getByText('Choose a delivery address to see your total.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pay' })).toBeDisabled();
    expect(api.requests()).not.toContain('POST /quotes');
  });

  it('invites the customer to add an address when there are none', async () => {
    await renderCheckout({ routes: { 'GET /addresses': { body: { data: [] } } } });

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Add a delivery address' }),
    ).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Add address/ })[0]).toHaveAttribute(
      'href',
      '/account/addresses/new?next=%2Fcheckout',
    );
  });

  it('says free delivery when the server charged none', async () => {
    await renderCheckout({
      routes: {
        'POST /quotes': () => ({
          status: 201,
          body: {
            data: quote({ subtotal: 5175, delivery_fee: 0, total: 5175, vat_included: 675 }),
          },
        }),
      },
    });

    const summary = await screen.findByRole('region', { name: 'Order summary' });
    expect(await within(summary).findByText('Free')).toBeVisible();
    expect(within(summary).queryByText('10.00 SAR')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Pay ${formatMoney(5175, 'en')}` }),
    ).toBeInTheDocument();
  });

  it('is in Arabic and right to left, with Saudi-time slots and riyal amounts', async () => {
    await renderCheckout({ language: 'ar' });

    expect(await screen.findByRole('heading', { level: 1, name: 'إتمام الطلب' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(await screen.findByRole('group', { name: 'الأحد، 25 أكتوبر' })).toBeVisible();
    expect(screen.getAllByRole('radio', { name: '9:00 ص – 11:00 ص' })).toHaveLength(2);
    expect(
      await screen.findByRole('button', { name: `ادفع ${formatMoney(2150, 'ar')}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'ملخص الطلب' })).toBeVisible();
    expect(screen.getByRole('radiogroup', { name: 'طريقة الدفع' })).toBeVisible();
    expect(screen.queryByText('Order summary')).not.toBeInTheDocument();
  });
});
