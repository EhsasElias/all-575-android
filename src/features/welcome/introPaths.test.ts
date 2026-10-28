import { describe, expect, it } from 'vitest';
import { afterIntroPath, initialWelcomePath, logoIntroPath, welcomePath } from './introPaths';

describe('launch destinations', () => {
  it('starts the intro on reloads of Home and preserves checkout and product links', () => {
    expect(initialWelcomePath({ pathname: '/home', search: '', hash: '' })).toBe('/welcome');
    const destination = '/checkout?promo=test#summary';
    expect(
      initialWelcomePath({ pathname: '/checkout', search: '?promo=test', hash: '#summary' }),
    ).toBe(welcomePath(destination));
    expect(logoIntroPath(destination)).toBe(
      `/welcome/logo?next=${encodeURIComponent(destination)}`,
    );
    expect(afterIntroPath(destination)).toBe(destination);
  });

  it.each([
    null,
    '/',
    '/welcome',
    '/welcome/logo?next=%2Fwelcome',
    'https://example.com',
    '//example.com',
    '/\\example.com',
  ])('avoids external destinations and introduction loops (%s)', (raw) => {
    expect(afterIntroPath(raw)).toBe('/home');
  });

  it('keeps a restarted logo sequence on the original destination', () => {
    expect(
      initialWelcomePath({ pathname: '/welcome/logo', search: '?next=%2Fcart', hash: '' }),
    ).toBe('/welcome?next=%2Fcart');
  });
});
