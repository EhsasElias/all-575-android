import { describe, expect, it } from 'vitest';
import { formatDate } from './formatDate';
import { pickText } from './localized';

describe('pickText', () => {
  it('returns the chosen language', () => {
    expect(pickText({ ar: 'بسكويت', en: 'Biscuits' }, 'ar')).toBe('بسكويت');
    expect(pickText({ ar: 'بسكويت', en: 'Biscuits' }, 'en')).toBe('Biscuits');
  });

  it('falls back to the other language only when the chosen one is empty', () => {
    expect(pickText({ ar: '', en: 'Biscuits' }, 'ar')).toBe('Biscuits');
    expect(pickText({ ar: '  ', en: 'Biscuits' }, 'ar')).toBe('Biscuits');
    expect(pickText({ ar: 'بسكويت', en: null }, 'en')).toBe('بسكويت');
  });

  it('returns an empty string when there is nothing to show', () => {
    expect(pickText(null, 'en')).toBe('');
    expect(pickText({ ar: null, en: null }, 'ar')).toBe('');
  });
});

describe('formatDate', () => {
  it('shows the date in Saudi time, with Latin digits, in both languages', () => {
    // 22:30 UTC on 30 Jan is already 31 Jan in Riyadh.
    const iso = '2026-01-30T22:30:00Z';

    expect(formatDate(iso, 'en')).toMatch(/31/);
    expect(formatDate(iso, 'en')).toMatch(/2026/);
    expect(formatDate(iso, 'ar')).toMatch(/31/);
    expect(formatDate(iso, 'ar')).toMatch(/2026/);
  });

  it('returns an empty string for a missing or invalid date', () => {
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate('not a date', 'ar')).toBe('');
  });
});
