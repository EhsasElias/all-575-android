import { describe, expect, it } from 'vitest';
import { currentPayment, isFinalStatus, isPayment } from './payment';
import { safeProviderUrl } from './paymentHandoff';
import { paymentView } from './paymentView';
import { pollDelayMs } from './polling';
import { readQuote } from './quote';
import { order, payment, quote } from './testData';

describe('readQuote', () => {
  it('reads what the server sent', () => {
    const read = readQuote(quote());

    expect(read).toMatchObject({
      id: '01m5qepms76n93z1rjvvwzb2gj',
      subtotal: 1150,
      deliveryFee: 1000,
      total: 2150,
      vatIncluded: 280,
      canCheckout: true,
      addressId: 1,
      promoCode: null,
    });
    expect(read?.lines).toHaveLength(1);
    expect(read?.lines[0]).toMatchObject({
      variantId: 1,
      quantity: 2,
      lineTotal: 1150,
      available: true,
    });
  });

  it.each([
    ['not an object', 'quote'],
    ['no id', quote({ id: undefined })],
    ['an unreadable expiry', quote({ expires_at: 'soon' })],
    ['a fractional amount', quote({ total: 21.5 })],
    ['an amount that is a string', quote({ total: '2150' })],
    ['no can_checkout', quote({ can_checkout: undefined })],
    ['a broken line', quote({ lines: [{ variant_id: 1 }] })],
    ['lines that are not a list', quote({ lines: 'none' })],
    ['a broken issue', quote({ issues: [{ code: 'x' }] })],
  ])('rejects a quote with %s', (_what, value) => {
    expect(readQuote(value)).toBeNull();
  });

  it('keeps unavailable lines and their issues', () => {
    const read = readQuote(
      quote({
        lines: [{ ...quote().lines[0], available: false, available_units: 0 }],
        issues: [{ variant_id: 1, code: 'unavailable', available_units: 0 }],
        can_checkout: false,
      }),
    );

    expect(read?.lines[0]?.available).toBe(false);
    expect(read?.issues).toEqual([{ variantId: 1, code: 'unavailable', availableUnits: 0 }]);
    expect(read?.canCheckout).toBe(false);
  });
});

describe('payments', () => {
  it('accepts a payment the way the API sends it, and nothing else', () => {
    expect(isPayment(payment())).toBe(true);
    expect(
      isPayment(payment({ action: { redirect_url: 'https://x.test', client_secret: null } })),
    ).toBe(true);
    expect(isPayment({ ...payment(), status: 'refunded' })).toBe(false);
    expect(isPayment({ ...payment(), amount: '2150' })).toBe(false);
    expect(isPayment({ ...payment(), action: 'redirect' })).toBe(false);
    expect(isPayment(null)).toBe(false);
  });

  it('picks the paid payment, otherwise the newest attempt', () => {
    const older = payment({ id: '01a', status: 'failed' });
    const newer = payment({ id: '01b', status: 'pending' });
    const paid = payment({ id: '01c', status: 'paid' });

    expect(currentPayment([newer, older])?.id).toBe('01b');
    expect(currentPayment([older, newer, paid])?.id).toBe('01c');
    expect(currentPayment([])).toBeNull();
  });

  it('knows which statuses end the waiting', () => {
    expect(isFinalStatus('paid')).toBe(true);
    expect(isFinalStatus('failed')).toBe(true);
    expect(isFinalStatus('expired')).toBe(true);
    expect(isFinalStatus('pending')).toBe(false);
    expect(isFinalStatus(undefined)).toBe(false);
  });

  it.each([
    ['https://pay.example.test/s/1', 'https://pay.example.test/s/1'],
    ['http://pay.example.test/s/1', null],
    ['javascript:alert(1)', null],
    ['intent://pay#Intent;end', null],
    ['not a url', null],
    ['', null],
    [null, null],
  ])('only opens a secure web address: %s', (raw, expected) => {
    expect(safeProviderUrl(raw)).toBe(expected);
  });
});

describe('paymentView', () => {
  const unpaid = order();
  it.each([
    ['a paid payment', { order: unpaid, payment: payment({ status: 'paid' }) }, 'paid'],
    ['a confirmed order', { order: order({ status: 'confirmed' }), payment: payment() }, 'paid'],
    ['a pending payment', { order: unpaid, payment: payment() }, 'pending'],
    [
      'a failed payment while the hold lasts',
      { order: unpaid, payment: payment({ status: 'failed' }), holdActive: true },
      'retry',
    ],
    [
      'an expired payment while the hold lasts',
      { order: unpaid, payment: payment({ status: 'expired' }), holdActive: true },
      'retry',
    ],
    [
      'a failed payment after the hold',
      { order: unpaid, payment: payment({ status: 'failed' }), holdActive: false },
      'closed',
    ],
    [
      'a refused retry',
      {
        order: unpaid,
        payment: payment({ status: 'failed' }),
        holdActive: true,
        retryRefused: true,
      },
      'closed',
    ],
    [
      'a cancelled order',
      {
        order: order({ status: 'cancelled' }),
        payment: payment({ status: 'expired' }),
        holdActive: true,
      },
      'closed',
    ],
    ['an order without payments', { order: unpaid, payment: null }, 'closed'],
  ])('shows the right step for %s', (_what, input, expected) => {
    expect(paymentView({ holdActive: false, retryRefused: false, ...input })).toBe(expected);
  });
});

describe('polling', () => {
  it('asks every 2 seconds at first, then a little slower, never beyond 8', () => {
    expect([0, 4].map(pollDelayMs)).toEqual([2000, 2000]);
    expect(pollDelayMs(5)).toBe(3000);
    expect(pollDelayMs(10)).toBe(4000);
    expect(pollDelayMs(1000)).toBe(8000);
  });
});
