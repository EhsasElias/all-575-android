import type { Language } from '@/shared/i18n';

/** The one display time zone of the app: every date a customer sees is Saudi time. */
export const DISPLAY_TIME_ZONE = 'Asia/Riyadh';

// Gregorian calendar and Latin digits in both languages (the Arabic locale defaults to the Hijri calendar).
// English is written day first ("24 Oct 2026"), which is how it is read in Saudi Arabia.
const LOCALE_TAGS: Record<Language, string> = {
  ar: 'ar-SA-u-ca-gregory-nu-latn',
  en: 'en-GB-u-ca-gregory-nu-latn',
};

type Style = 'date' | 'dateTime';

const DATE_FIELDS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const TIME_FIELDS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

const STYLE_OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  date: DATE_FIELDS,
  dateTime: { ...DATE_FIELDS, ...TIME_FIELDS },
};

function createFormatter(language: Language, style: Style): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE_TAGS[language], {
    timeZone: DISPLAY_TIME_ZONE,
    ...STYLE_OPTIONS[style],
  });
}

const formatters = {
  date: { ar: createFormatter('ar', 'date'), en: createFormatter('en', 'date') },
  dateTime: { ar: createFormatter('ar', 'dateTime'), en: createFormatter('en', 'dateTime') },
};

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `24 Oct 2026` */
export function formatDate(iso: string, language: Language): string {
  const date = parse(iso);
  return date === null ? '' : formatters.date[language].format(date);
}

/** `24 Oct 2026, 8:18 PM` */
export function formatDateTime(iso: string, language: Language): string {
  const date = parse(iso);
  return date === null ? '' : formatters.dateTime[language].format(date);
}

/** A calendar day such as `2026-10-24` (a report's `from` and `to`), without any time-zone shift. */
export function formatDay(day: string, language: Language): string {
  // Noon in Riyadh is the same calendar day everywhere on earth that the formatter could be asked about.
  return formatDate(`${day}T12:00:00+03:00`, language);
}

/** `24 Oct 2026, 9:00 – 11:00 AM`: a delivery slot, or one moment when the end is unknown. */
export function formatDateTimeRange(
  startIso: string,
  endIso: string | null,
  language: Language,
): string {
  const start = parse(startIso);
  const end = endIso === null ? null : parse(endIso);
  if (start === null) return '';
  if (end === null) return formatters.dateTime[language].format(start);
  return formatters.dateTime[language].formatRange(start, end);
}

const relativeFormatters: Record<Language, Intl.RelativeTimeFormat> = {
  ar: new Intl.RelativeTimeFormat(LOCALE_TAGS.ar, { numeric: 'always' }),
  en: new Intl.RelativeTimeFormat(LOCALE_TAGS.en, { numeric: 'always' }),
};

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

/** "in 6 days", "in 3 hours" or "in 12 minutes"; null once the moment has passed. */
export function formatTimeLeft(untilIso: string, nowMs: number, language: Language): string | null {
  const until = parse(untilIso);
  if (until === null || until.getTime() <= nowMs) return null;
  const minutes = Math.ceil((until.getTime() - nowMs) / MS_PER_MINUTE);
  const formatter = relativeFormatters[language];
  if (minutes >= MINUTES_PER_DAY)
    return formatter.format(Math.floor(minutes / MINUTES_PER_DAY), 'day');
  if (minutes >= MINUTES_PER_HOUR) {
    return formatter.format(Math.floor(minutes / MINUTES_PER_HOUR), 'hour');
  }
  return formatter.format(minutes, 'minute');
}
