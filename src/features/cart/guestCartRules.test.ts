import { describe, expect, it } from 'vitest';
import { MAX_CART_LINES } from './cartRules';
import { addGuestLine, setGuestQuantity, toMergeItems } from './guestCartRules';
import { BISCUITS, CHOCOLATE, NOTEBOOK, guestLine } from './testData';

describe('setting a guest line quantity', () => {
  const lines = [guestLine(BISCUITS, 2), guestLine(CHOCOLATE, 1)];

  it('changes the quantity of the line', () => {
    expect(setGuestQuantity(lines, BISCUITS.variantId, 5)).toEqual({
      ok: true,
      lines: [guestLine(BISCUITS, 5), guestLine(CHOCOLATE, 1)],
    });
  });

  it('accepts the limit of 20', () => {
    expect(setGuestQuantity(lines, BISCUITS.variantId, 20).ok).toBe(true);
  });

  it('removes the line at zero, and zero for a line that is not there is fine', () => {
    expect(setGuestQuantity(lines, BISCUITS.variantId, 0)).toEqual({
      ok: true,
      lines: [guestLine(CHOCOLATE, 1)],
    });
    expect(setGuestQuantity(lines, NOTEBOOK.variantId, 0)).toEqual({ ok: true, lines });
  });

  it.each([21, 100, -1, 1.5, Number.NaN])('refuses %s as quantity_out_of_range', (quantity) => {
    expect(setGuestQuantity(lines, BISCUITS.variantId, quantity)).toEqual({
      ok: false,
      reason: 'quantity_out_of_range',
    });
  });

  it('cannot invent a line it knows nothing about', () => {
    expect(setGuestQuantity(lines, NOTEBOOK.variantId, 2)).toEqual({
      ok: false,
      reason: 'variant_unavailable',
    });
  });

  it('does not change the lines it was given', () => {
    setGuestQuantity(lines, BISCUITS.variantId, 9);

    expect(lines[0]?.quantity).toBe(2);
  });
});

describe('adding to the guest cart', () => {
  it('starts a new line with the snapshot of the product', () => {
    expect(addGuestLine([], NOTEBOOK, 3)).toEqual({
      ok: true,
      lines: [guestLine(NOTEBOOK, 3)],
      quantity: 3,
      capped: false,
    });
  });

  it('adds onto a line that is already there', () => {
    const result = addGuestLine([guestLine(BISCUITS, 4)], BISCUITS, 2);

    expect(result).toMatchObject({ ok: true, quantity: 6, capped: false });
    expect(result.ok && result.lines).toEqual([guestLine(BISCUITS, 6)]);
  });

  it('stops at 20 and says it did', () => {
    const result = addGuestLine([guestLine(BISCUITS, 15)], BISCUITS, 10);

    expect(result).toMatchObject({ ok: true, quantity: 20, capped: true });
    expect(result.ok && result.lines).toEqual([guestLine(BISCUITS, 20)]);
  });

  it('is not "capped" when it lands exactly on 20', () => {
    expect(addGuestLine([guestLine(BISCUITS, 10)], BISCUITS, 10)).toMatchObject({
      quantity: 20,
      capped: false,
    });
  });

  it.each([0, -1, 21, 2.5])('refuses to add %s', (amount) => {
    expect(addGuestLine([], BISCUITS, amount)).toEqual({
      ok: false,
      reason: 'quantity_out_of_range',
    });
  });

  it('refuses a 51st line but still lets an existing line grow', () => {
    const full = Array.from({ length: MAX_CART_LINES }, (_, index) =>
      guestLine({ ...BISCUITS, variantId: index + 100 }, 1),
    );

    expect(addGuestLine(full, NOTEBOOK, 1)).toEqual({ ok: false, reason: 'cart_full' });
    expect(addGuestLine(full, { ...BISCUITS, variantId: 100 }, 1)).toMatchObject({ ok: true });
  });
});

describe('what is sent when the guest signs in', () => {
  it('sends the variant and quantity of every line, and nothing else', () => {
    expect(toMergeItems([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 20)])).toEqual([
      { variant_id: 1, quantity: 2 },
      { variant_id: 7, quantity: 20 },
    ]);
  });

  it('brings a quantity above the server limit down before sending it', () => {
    expect(toMergeItems([{ ...guestLine(BISCUITS, 1), quantity: 99 }])).toEqual([
      { variant_id: 1, quantity: 20 },
    ]);
  });

  it('never sends a quantity below 1', () => {
    expect(toMergeItems([{ ...guestLine(BISCUITS, 1), quantity: 0 }])).toEqual([
      { variant_id: 1, quantity: 1 },
    ]);
  });

  it('joins a repeated variant into one entry, still within the limit', () => {
    expect(toMergeItems([guestLine(BISCUITS, 15), guestLine(BISCUITS, 15)])).toEqual([
      { variant_id: 1, quantity: 20 },
    ]);
  });

  it('sends at most 50 entries', () => {
    const many = Array.from({ length: 70 }, (_, index) =>
      guestLine({ ...BISCUITS, variantId: index + 1 }, 1),
    );

    expect(toMergeItems(many)).toHaveLength(50);
  });
});
