import { describe, expect, it } from 'vitest';
import { priceGuestLines } from './cartRules';
import { addGuestLine } from './guestCartRules';
import { parseGuestCart, serializeGuestCart } from './guestCartStorage';
import { BISCUITS, NOTEBOOK } from './testData';

describe('Guest cart catalog prices', () => {
  it('preserves mixed catalog prices through storage and totals each line separately', () => {
    const lines = parseGuestCart(
      serializeGuestCart([
        { ...BISCUITS, quantity: 2, unitPrice: 100 },
        { ...NOTEBOOK, quantity: 1, unitPrice: 250 },
      ]),
    );
    const cart = priceGuestLines(lines, 575);
    expect(cart.subtotal).toBe(450);
    expect(cart.lines.map((line) => line.unitPrice)).toEqual([100, 250]);
  });

  it('refreshes a saved price when adding again and sends only quantity/variant at server merge', () => {
    const result = addGuestLine(
      [{ ...BISCUITS, quantity: 1, unitPrice: 100 }],
      { ...BISCUITS, unitPrice: 200 },
      1,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(priceGuestLines(result.lines, 575).subtotal).toBe(400);
  });
});
