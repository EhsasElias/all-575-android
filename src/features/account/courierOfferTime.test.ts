import { describe, expect, it } from 'vitest';
import { isExpiredCourierOffer } from './courierOfferTime';

describe('courier offer expiration', () => {
  const deadline = '2026-11-19T12:00:00Z';
  const timestamp = Date.parse(deadline);

  it('disables offers until the first clock reading is available', () => {
    expect(isExpiredCourierOffer(deadline, null)).toBe(true);
  });

  it('accepts a future deadline and disables at the exact expiry boundary', () => {
    expect(isExpiredCourierOffer(deadline, timestamp - 1)).toBe(false);
    expect(isExpiredCourierOffer(deadline, timestamp)).toBe(true);
    expect(isExpiredCourierOffer(deadline, timestamp + 1)).toBe(true);
  });

  it('allows offers with no expiry after the clock is initialized', () => {
    expect(isExpiredCourierOffer(null, timestamp)).toBe(false);
  });

  it('rejects malformed deadlines rather than allowing expired offers', () => {
    expect(isExpiredCourierOffer('not-a-date', timestamp)).toBe(true);
  });
});
