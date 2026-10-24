import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { chooseFirstSlot, payNow, refusal } from './checkoutActions';
import { renderCheckout } from './checkoutHarness';
import { createShop } from './shopServer';
import { order, payment } from './testData';

const placed = {
  status: 201,
  body: { data: { order: order(), payment: payment(), replayed: false } },
};

type Reply = { status: number; body: unknown } | 'offline';

/** `POST /checkout` answers from `replies` in turn and remembers the key it was sent with. */
function scriptedCheckout(replies: Reply[]) {
  const keys: (string | null)[] = [];
  const handler = ({ headers }: { headers: Headers }): Reply => {
    keys.push(headers.get('Idempotency-Key'));
    return replies[Math.min(keys.length, replies.length) - 1] ?? 'offline';
  };
  return { keys, handler, routes: { ...createShop().routes, 'POST /checkout': handler } };
}

describe('Checkout: the idempotency key', () => {
  it('reuses the key when the same attempt is repeated after a lost answer', async () => {
    const user = userEvent.setup();
    const { keys, routes } = scriptedCheckout(['offline', 'offline', placed]);
    await renderCheckout({ routes });
    await chooseFirstSlot(user);

    await payNow(user);
    await screen.findByText('We did not hear back');
    await payNow(user);
    await screen.findByText('We did not hear back');
    await payNow(user);

    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('uses a new key once the server has answered with a refusal', async () => {
    const user = userEvent.setup();
    const { keys, routes } = scriptedCheckout([refusal(409, 'slot_full'), placed]);
    await renderCheckout({ routes });
    await chooseFirstSlot(user);

    await payNow(user);
    await screen.findByText('That delivery time just filled up');
    await chooseFirstSlot(user);
    await payNow(user);

    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
  });

  it('uses a new key when the delivery time changes', async () => {
    const user = userEvent.setup();
    const { keys, routes } = scriptedCheckout(['offline', placed]);
    await renderCheckout({ routes });
    await chooseFirstSlot(user);
    await payNow(user);
    await screen.findByText('We did not hear back');

    const monday = screen.getByRole('group', { name: 'Monday, October 26' });
    await user.click(within(monday).getByRole('radio', { name: '9:00 AM – 11:00 AM' }));
    await payNow(user);

    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    expect(keys[1]).not.toBe(keys[0]);
  });

  it('uses a new key when the payment method changes', async () => {
    const user = userEvent.setup();
    const { keys, routes } = scriptedCheckout(['offline', placed]);
    await renderCheckout({ routes });
    await chooseFirstSlot(user);
    await payNow(user);
    await screen.findByText('We did not hear back');

    await user.click(screen.getByRole('radio', { name: /Visa or Mastercard/ }));
    await payNow(user);

    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    expect(keys[1]).not.toBe(keys[0]);
  });

  it('clears the last refusal as soon as the customer changes what it was about', async () => {
    const user = userEvent.setup();
    await renderCheckout({ routes: { 'POST /checkout': refusal(409, 'slot_full') } });
    await chooseFirstSlot(user);
    await payNow(user);
    await screen.findByText('That delivery time just filled up');

    await chooseFirstSlot(user);

    expect(screen.queryByText('That delivery time just filled up')).not.toBeInTheDocument();
  });
});
