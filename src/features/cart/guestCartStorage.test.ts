import { describe, expect, it } from 'vitest';
import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from './cartRules';
import { parseGuestCart, serializeGuestCart } from './guestCartStorage';
import { BISCUITS, CHOCOLATE, NOTEBOOK, guestLine } from './testData';

const stored = (lines: unknown, version: unknown = 1): string => JSON.stringify({ version, lines });

describe('reading the stored guest cart', () => {
  it('is empty when nothing was stored', () => {
    expect(parseGuestCart(null)).toEqual([]);
  });

  it('gives back exactly what was written', () => {
    const lines = [guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 20)];

    expect(parseGuestCart(serializeGuestCart(lines))).toEqual(lines);
  });

  it.each([
    ['text that is not JSON', 'not json {'],
    ['an empty string', ''],
    ['JSON null', 'null'],
    ['a bare array', '[]'],
    ['a number', '42'],
    ['an object without lines', '{"version":1}'],
    ['lines that are not a list', stored({ variantId: 1 })],
    ['a version this app does not know', stored([guestLine(BISCUITS, 1)], 2)],
    ['no version', JSON.stringify({ lines: [guestLine(BISCUITS, 1)] })],
  ])('treats %s as an empty cart without throwing', (_name, text) => {
    expect(parseGuestCart(text)).toEqual([]);
  });

  it('drops a line that is broken and keeps the good ones next to it', () => {
    const good = guestLine(CHOCOLATE, 3);
    const text = stored([{ variantId: 'one' }, null, 'text', 7, good, []]);

    expect(parseGuestCart(text)).toEqual([good]);
  });

  it.each([
    ['a zero quantity', { ...guestLine(BISCUITS, 1), quantity: 0 }],
    ['a negative quantity', { ...guestLine(BISCUITS, 1), quantity: -2 }],
    ['a fractional quantity', { ...guestLine(BISCUITS, 1), quantity: 1.5 }],
    ['a quantity written as text', { ...guestLine(BISCUITS, 1), quantity: '2' }],
    ['a missing variant', { ...guestLine(BISCUITS, 1), variantId: undefined }],
    ['a variant id that is not a whole number', { ...guestLine(BISCUITS, 1), variantId: 1.2 }],
    ['an empty product slug', { ...guestLine(BISCUITS, 1), productSlug: '' }],
    ['a name that is only one language', { ...guestLine(BISCUITS, 1), name: { en: 'Biscuits' } }],
    ['a name that is not text', { ...guestLine(BISCUITS, 1), name: { ar: 1, en: 2 } }],
    [
      'a name that is far too long',
      { ...guestLine(BISCUITS, 1), name: { ar: 'ب'.repeat(5000), en: 'B' } },
    ],
    ['a variant name of the wrong type', { ...guestLine(BISCUITS, 1), variantName: 'Blue' }],
    ['a missing variant name', { ...guestLine(BISCUITS, 1), variantName: undefined }],
  ])('drops a line with %s', (_name, line) => {
    expect(parseGuestCart(stored([line, guestLine(CHOCOLATE, 1)]))).toEqual([
      guestLine(CHOCOLATE, 1),
    ]);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '/relative/path.png',
    'not a url',
  ])('does not accept %s as an image address', (imageUrl) => {
    expect(parseGuestCart(stored([{ ...guestLine(BISCUITS, 1), imageUrl }]))).toEqual([]);
  });

  it('accepts a missing image (null) and a web address', () => {
    const lines = [guestLine(CHOCOLATE, 1), guestLine(BISCUITS, 1)];

    expect(parseGuestCart(stored(lines))).toEqual(lines);
  });

  it('brings a quantity above the limit down to the limit', () => {
    const [line] = parseGuestCart(stored([{ ...guestLine(BISCUITS, 1), quantity: 500 }]));

    expect(line?.quantity).toBe(MAX_QUANTITY_PER_LINE);
  });

  it('keeps only the first line of a repeated variant', () => {
    const text = stored([guestLine(BISCUITS, 2), guestLine(BISCUITS, 9)]);

    expect(parseGuestCart(text)).toEqual([guestLine(BISCUITS, 2)]);
  });

  it('keeps no more lines than the cart can hold', () => {
    const many = Array.from({ length: 80 }, (_, index) =>
      guestLine({ ...BISCUITS, variantId: index + 1 }, 1),
    );

    expect(parseGuestCart(stored(many))).toHaveLength(MAX_CART_LINES);
  });

  it('rebuilds each line, so unexpected fields do not survive', () => {
    const [line] = parseGuestCart(stored([{ ...guestLine(BISCUITS, 1), price: 1, html: '<b>' }]));

    expect(line).toEqual(guestLine(BISCUITS, 1));
    expect(Object.keys(line ?? {}).sort()).toEqual(
      ['imageUrl', 'name', 'productSlug', 'quantity', 'variantId', 'variantName'].sort(),
    );
  });
});
