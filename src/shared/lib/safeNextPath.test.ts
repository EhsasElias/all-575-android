import { describe, expect, it } from 'vitest';
import { safeNextPath } from './safeNextPath';

describe('safeNextPath', () => {
  it('keeps a path inside the app, including its query', () => {
    expect(safeNextPath('/cart')).toBe('/cart');
    expect(safeNextPath('/orders/abc?tab=tracking')).toBe('/orders/abc?tab=tracking');
  });

  it.each([
    null,
    '',
    'cart',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ])('falls back to home for %s', (raw) => {
    expect(safeNextPath(raw)).toBe('/home');
  });
});
