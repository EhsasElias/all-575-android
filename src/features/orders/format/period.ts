import { DISPLAY_TIME_ZONE } from './dateTime';
import type { DateRange } from '../types';

export type PresetPeriod = 'week' | 'month';

const MS_PER_DAY = 86_400_000;
const PRESET_DAYS: Record<PresetPeriod, number> = { week: 7, month: 30 };

// en-CA writes dates as YYYY-MM-DD, which is what the API and <input type="date"> speak.
const calendarDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's date in Saudi time, whatever the device's own time zone is. */
export function todayInRiyadh(now: Date): string {
  return calendarDay.format(now);
}

export function shiftDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** "Last 7 days" and "Last 30 days", both ending today and counting today. */
export function presetRange(period: PresetPeriod, now: Date): DateRange {
  const to = todayInRiyadh(now);
  return { from: shiftDays(to, 1 - PRESET_DAYS[period]), to };
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A complete range whose end is not before its start (ISO dates compare correctly as text). */
export function isUsableRange(range: DateRange): boolean {
  return DAY_PATTERN.test(range.from) && DAY_PATTERN.test(range.to) && range.from <= range.to;
}
