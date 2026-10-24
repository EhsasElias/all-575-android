import { describe, expect, it } from 'vitest';
import { isCompleteCode, sanitizeCode } from './otpCode';

describe('sanitizeCode', () => {
  it.each([
    ['123456', '123456'],
    ['123 456', '123456'],
    ['123-456', '123456'],
    ['١٢٣٤٥٦', '123456'],
    ['12a3b4', '1234'],
    ['1234567890', '123456'],
    ['', ''],
  ])('turns %j into %j', (pasted, kept) => {
    expect(sanitizeCode(pasted)).toBe(kept);
  });
});

describe('isCompleteCode', () => {
  it('is true only for exactly six digits', () => {
    expect(isCompleteCode('123456')).toBe(true);
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('')).toBe(false);
  });
});
