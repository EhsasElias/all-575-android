import { describe, expect, it } from 'vitest';
import { countItems, planAddition, priceGuestLines, summarize, withQuantity } from './cartRules';
import { BISCUITS, CHOCOLATE, NOTEBOOK, UNIT_PRICE, guestLine } from './testData';

describe('planAddition', () => {
  it('adds the amount to what is already there', () => {
    expect(planAddition(0, 1)).toEqual({ quantity: 1, capped: false });
    expect(planAddition(3, 4)).toEqual({ quantity: 7, capped: false });
  });

  it('never goes above 20 and reports that it stopped', () => {
    expect(planAddition(18, 5)).toEqual({ quantity: 20, capped: true });
    expect(planAddition(20, 1)).toEqual({ quantity: 20, capped: true });
  });

  it('reaching 20 exactly is not capping', () => {
    expect(planAddition(19, 1)).toEqual({ quantity: 20, capped: false });
  });

  it.each([0, -3, 21, 1.5, Number.NaN])('has no plan for an amount of %s', (amount) => {
    expect(planAddition(2, amount)).toBeNull();
  });
});

describe('pricing the guest cart', () => {
  const lines = [guestLine(BISCUITS, 2), guestLine(CHOCOLATE, 1), guestLine(NOTEBOOK, 3)];

  it('prices every line with the one store price', () => {
    const priced = priceGuestLines(lines, UNIT_PRICE);

    expect(priced.lines.map((line) => line.linePrice)).toEqual([1150, 575, 1725]);
    expect(priced.lines.every((line) => line.unitPrice === 575)).toBe(true);
  });

  it('adds up items and subtotal in halalas', () => {
    expect(priceGuestLines(lines, UNIT_PRICE)).toMatchObject({ itemsCount: 6, subtotal: 3450 });
  });

  it('does not claim to know the stock', () => {
    expect(priceGuestLines(lines, UNIT_PRICE).lines.map((line) => line.availability)).toEqual([
      'unknown',
      'unknown',
      'unknown',
    ]);
  });

  it('counts items without needing a price', () => {
    expect(countItems(lines)).toBe(6);
    expect(countItems([])).toBe(0);
  });
});

describe('withQuantity (instant feedback before the server answers)', () => {
  const cart = priceGuestLines([guestLine(BISCUITS, 2), guestLine(CHOCOLATE, 1)], UNIT_PRICE);

  it('changes the line and the totals', () => {
    const next = withQuantity(cart, BISCUITS.variantId, 5);

    expect(next.lines[0]).toMatchObject({ quantity: 5, linePrice: 2875 });
    expect(next).toMatchObject({ itemsCount: 6, subtotal: 3450 });
  });

  it('removes the line at zero', () => {
    const next = withQuantity(cart, BISCUITS.variantId, 0);

    expect(next.lines.map((line) => line.variantId)).toEqual([CHOCOLATE.variantId]);
    expect(next).toMatchObject({ itemsCount: 1, subtotal: 575 });
  });

  it('leaves a cart alone when the line is not in it, and never edits the original', () => {
    expect(withQuantity(cart, NOTEBOOK.variantId, 3)).toEqual(summarize(cart.lines));
    expect(cart.lines[0]?.quantity).toBe(2);
  });
});
