import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDateTimeRange,
  formatDay,
  formatTimeLeft,
} from './dateTime';

// 17:18 UTC is 20:18 in Riyadh (UTC+3, no daylight saving).
const MOMENT = '2026-10-24T17:18:04.000000Z';
const ARABIC_INDIC_DIGITS = /[٠-٩]/;

describe('dates are shown in Saudi time', () => {
  it('converts to Asia/Riyadh in English', () => {
    expect(formatDateTime(MOMENT, 'en')).toMatch(/24 Oct 2026.*8:18\s?pm/);
  });

  it('uses the Gregorian calendar and Latin digits in Arabic', () => {
    const text = formatDateTime(MOMENT, 'ar');
    expect(text).toContain('2026');
    expect(text).toMatch(/8:18/);
    expect(text).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it('rolls over to the next day when Riyadh is already past midnight', () => {
    expect(formatDate('2026-10-24T22:30:00Z', 'en')).toBe('25 Oct 2026');
  });

  it('returns an empty string for something that is not a date', () => {
    expect(formatDateTime('not a date', 'en')).toBe('');
    expect(formatDateTimeRange('nope', null, 'en')).toBe('');
  });

  it('keeps a calendar day on that day', () => {
    expect(formatDay('2026-10-24', 'en')).toBe('24 Oct 2026');
  });
});

describe('a delivery slot', () => {
  it('shows one date and the two times', () => {
    const text = formatDateTimeRange('2026-10-25T06:00:00Z', '2026-10-25T08:00:00Z', 'en');
    expect(text).toContain('25 Oct 2026');
    expect(text).toMatch(/9:00/);
    expect(text).toMatch(/11:00/);
  });

  it('falls back to the start when the end is unknown', () => {
    expect(formatDateTimeRange('2026-10-25T06:00:00Z', null, 'en')).toMatch(/25 Oct 2026.*9:00/);
  });
});

describe('time left', () => {
  const now = Date.parse('2026-10-24T12:00:00Z');

  it('speaks in days, then hours, then minutes', () => {
    expect(formatTimeLeft('2026-10-30T12:30:00Z', now, 'en')).toBe('in 6 days');
    expect(formatTimeLeft('2026-10-24T15:30:00Z', now, 'en')).toBe('in 3 hours');
    expect(formatTimeLeft('2026-10-24T12:12:00Z', now, 'en')).toBe('in 12 minutes');
  });

  it('is null once the moment has passed', () => {
    expect(formatTimeLeft('2026-10-24T11:59:00Z', now, 'en')).toBeNull();
  });

  it('uses Latin digits in Arabic', () => {
    const text = formatTimeLeft('2026-10-30T12:30:00Z', now, 'ar');
    expect(text).toContain('6');
    expect(text).not.toMatch(ARABIC_INDIC_DIGITS);
  });
});
