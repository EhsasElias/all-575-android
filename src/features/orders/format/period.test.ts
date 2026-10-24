import { describe, expect, it } from 'vitest';
import { isUsableRange, presetRange, shiftDays, todayInRiyadh } from './period';

describe('today in Riyadh', () => {
  it('is the Saudi calendar day, not the device or UTC day', () => {
    expect(todayInRiyadh(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25');
    expect(todayInRiyadh(new Date('2026-10-24T20:59:00Z'))).toBe('2026-10-24');
  });
});

describe('preset periods', () => {
  const now = new Date('2026-10-24T12:00:00Z');

  it('last 7 days ends today and counts today', () => {
    expect(presetRange('week', now)).toEqual({ from: '2026-10-18', to: '2026-10-24' });
  });

  it('last 30 days ends today and counts today', () => {
    expect(presetRange('month', now)).toEqual({ from: '2026-09-25', to: '2026-10-24' });
  });

  it('crosses a year boundary', () => {
    expect(shiftDays('2026-01-03', -5)).toBe('2025-12-29');
  });
});

describe('a usable range', () => {
  it.each([
    [{ from: '2026-10-01', to: '2026-10-01' }, true],
    [{ from: '2026-10-01', to: '2026-10-24' }, true],
    [{ from: '2026-10-24', to: '2026-10-01' }, false],
    [{ from: '', to: '2026-10-01' }, false],
    [{ from: '2026-10-01', to: '' }, false],
  ])('%j is %s', (range, usable) => {
    expect(isUsableRange(range)).toBe(usable);
  });
});
