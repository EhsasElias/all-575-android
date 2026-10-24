import { describe, expect, it } from 'vitest';
import { formatMoney, formatNumber } from './format';

// Intl puts no-break spaces and bidi marks around amounts; compare the visible text.
function visible(text: string): string {
  return text.replace(/[‎‏؜]/g, '').replace(/\s/g, ' ');
}

describe('formatMoney', () => {
  it('turns 575 halalas into 5.75 in both languages', () => {
    expect(formatMoney(575, 'en')).toContain('5.75');
    expect(formatMoney(575, 'ar')).toContain('5.75');
  });

  it('shows SAR in English, after the amount', () => {
    expect(visible(formatMoney(575, 'en'))).toBe('5.75 SAR');
  });

  it('shows ر.س in Arabic, after the amount', () => {
    expect(visible(formatMoney(575, 'ar'))).toBe('5.75 ر.س');
  });

  it('always shows two decimals', () => {
    expect(visible(formatMoney(100, 'en'))).toBe('1.00 SAR');
    expect(visible(formatMoney(5, 'en'))).toBe('0.05 SAR');
    expect(visible(formatMoney(0, 'en'))).toBe('0.00 SAR');
  });

  it('keeps the amount and the currency together on one line', () => {
    expect(formatMoney(575, 'en')).toContain('\u00a0');
    expect(formatMoney(575, 'ar')).toContain('\u00a0');
  });

  it('groups thousands and keeps Latin digits in Arabic', () => {
    expect(visible(formatMoney(123_456_789, 'en'))).toBe('1,234,567.89 SAR');
    expect(visible(formatMoney(123_456_789, 'ar'))).toBe('1,234,567.89 ر.س');
    expect(formatMoney(123_456_789, 'ar')).not.toMatch(/[٠-٩]/);
  });

  it('formats refunds as negative amounts', () => {
    expect(visible(formatMoney(-575, 'en'))).toBe('-5.75 SAR');
    expect(visible(formatMoney(-575, 'ar'))).toContain('5.75');
    expect(formatMoney(-575, 'ar')).toContain('-');
  });

  it.each([5.75, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    'rejects %s because money is a whole number of halalas',
    (amount) => {
      expect(() => formatMoney(amount, 'en')).toThrow(RangeError);
    },
  );
});

describe('formatNumber', () => {
  it('uses Latin digits in Arabic and English', () => {
    expect(formatNumber(1234, 'ar')).toBe('1,234');
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatNumber(7, 'ar')).toBe('7');
  });
});
