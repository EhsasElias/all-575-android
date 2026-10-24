import { describe, expect, it } from 'vitest';
import { toCartContents } from './serverCart';
import { BISCUITS, NOTEBOOK, cartResource, serverLine } from './testData';

describe('reading the server cart', () => {
  it('maps each line to the shape the screens use', () => {
    const cart = toCartContents(cartResource([serverLine(NOTEBOOK, 3, 'low_stock')]));

    expect(cart.lines).toEqual([
      {
        ...NOTEBOOK,
        quantity: 3,
        unitPrice: 575,
        linePrice: 1725,
        availability: 'low_stock',
      },
    ]);
  });

  it('takes the totals the server sent', () => {
    const cart = toCartContents(cartResource([serverLine(BISCUITS, 2), serverLine(NOTEBOOK, 1)]));

    expect(cart).toMatchObject({ itemsCount: 3, subtotal: 1725 });
  });

  it('reads an empty cart', () => {
    expect(toCartContents(cartResource([]))).toEqual({ lines: [], itemsCount: 0, subtotal: 0 });
  });

  it('turns a variant name with only one language into a complete bilingual name', () => {
    const line = { ...serverLine(NOTEBOOK, 1), variant_name: { ar: null, en: 'Blue' } };

    expect(toCartContents(cartResource([line])).lines[0]?.variantName).toEqual({
      ar: 'Blue',
      en: 'Blue',
    });
  });

  it('treats a variant name that is empty in both languages as no name', () => {
    const line = { ...serverLine(BISCUITS, 1), variant_name: { ar: null, en: null } };

    expect(toCartContents(cartResource([line])).lines[0]?.variantName).toBeNull();
  });

  it('recomputes an amount that is not whole halalas instead of showing it', () => {
    const resource = {
      ...cartResource([{ ...serverLine(BISCUITS, 2), line_price: 11.5 }]),
      subtotal: 11.5,
    };

    const cart = toCartContents(resource);

    expect(cart.lines[0]?.linePrice).toBe(1150);
    expect(cart.subtotal).toBe(1150);
  });
});
