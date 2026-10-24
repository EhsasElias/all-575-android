import { describe, expect, it } from 'vitest';
import { formatCountdown } from './formatCountdown';

describe('formatCountdown', () => {
  it.each([
    [60, '1:00'],
    [59, '0:59'],
    [75, '1:15'],
    [9, '0:09'],
    [0, '0:00'],
    [-4, '0:00'],
    [0.2, '0:01'],
  ])('shows %s seconds as %s', (seconds, shown) => {
    expect(formatCountdown(seconds)).toBe(shown);
  });
});
