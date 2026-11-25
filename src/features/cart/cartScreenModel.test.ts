import { describe, expect, it } from 'vitest';
import { mayCheckout, payable, toScreenLines } from './cartScreenModel';
import { priceGuestLines } from './cartRules';
import { BISCUITS, CHOCOLATE, NOTEBOOK, UNIT_PRICE, guestLine } from './testData';

const lines = priceGuestLines(
  [guestLine(BISCUITS, 2), guestLine(CHOCOLATE, 1), guestLine(NOTEBOOK, 3)],
  UNIT_PRICE,
).lines;

describe('flagging lines that cannot be bought', () => {
  it('flags nothing when nothing is known', () => {
    const screen = toScreenLines(lines, new Map(), new Set());

    expect(screen.map((line) => line.problem)).toEqual([null, null, null]);
  });

  it('flags a line the delivery address cannot get, and keeps it in the list', () => {
    const screen = toScreenLines(
      lines,
      new Map([[CHOCOLATE.variantId, 'out_of_stock']]),
      new Set(),
    );

    expect(screen).toHaveLength(3);
    expect(screen.map((line) => line.problem)).toEqual([null, 'out_of_stock', null]);
    expect(screen[1]?.availability).toBe('out_of_stock');
  });

  it('flags a line the server said is no longer sold', () => {
    const screen = toScreenLines(lines, new Map(), new Set([NOTEBOOK.variantId]));

    expect(screen.map((line) => line.problem)).toEqual([null, null, 'gone']);
  });

  it('does not flag low stock', () => {
    const screen = toScreenLines(lines, new Map([[BISCUITS.variantId, 'low_stock']]), new Set());

    expect(screen[0]?.problem).toBeNull();
  });
});

describe('what the customer can buy', () => {
  it('leaves the flagged lines out of the items and the subtotal, like the quote does', () => {
    const screen = toScreenLines(
      lines,
      new Map([[CHOCOLATE.variantId, 'out_of_stock']]),
      new Set(),
    );

    expect(payable(screen)).toEqual({ items: 5, subtotal: 5 * UNIT_PRICE });
  });

  it('is nothing when every line is flagged', () => {
    const screen = toScreenLines(
      lines,
      new Map(lines.map((line) => [line.variantId, 'out_of_stock'] as const)),
      new Set(),
    );

    expect(payable(screen)).toEqual({ items: 0, subtotal: 0 });
  });
});

describe('checkout eligibility', () => {
  it('allows checkout only when every line is available', () => {
    const ready = toScreenLines(lines, new Map(), new Set());
    expect(mayCheckout(ready)).toBe(true);
    expect(mayCheckout([])).toBe(false);

    const unavailable = toScreenLines(
      lines,
      new Map([[CHOCOLATE.variantId, 'out_of_stock']]),
      new Set(),
    );
    expect(mayCheckout(unavailable)).toBe(false);
    expect(payable(unavailable).items).toBeGreaterThan(0);

    const discontinued = toScreenLines(lines, new Map(), new Set([NOTEBOOK.variantId]));
    expect(mayCheckout(discontinued)).toBe(false);
  });

  it('blocks signed-in checkout until the API confirms the stock status', () => {
    const unverified = toScreenLines(lines, new Map(), new Set()).map((line) => ({
      ...line,
      availability: 'unknown' as const,
    }));
    expect(mayCheckout(unverified, true)).toBe(false);
    // A guest can reach sign-in; the server then checks stock before payment.
    expect(mayCheckout(unverified, false)).toBe(true);

    const verified = unverified.map((line) => ({
      ...line,
      availability: 'in_stock' as const,
    }));
    expect(mayCheckout(verified, true)).toBe(true);
  });
});
