import type { Language } from '@/shared/i18n';

/** Every time the server sends is UTC; customers read it in Saudi time. */
const TIME_ZONE = 'Asia/Riyadh';
const LOCALES: Record<Language, string> = { ar: 'ar-SA', en: 'en-SA', fr: 'fr-FR' };

/** French is read on a 24-hour clock; Arabic and English in Saudi Arabia on a 12-hour one. */
const uses12Hours = (language: Language): boolean => language !== 'fr';

const formatters = new Map<string, Intl.DateTimeFormat>();

// Gregorian calendar and Latin digits, like the rest of the app (ar-SA would otherwise use the Hijri calendar).
function formatterFor(
  language: Language,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${language}:${JSON.stringify(options)}`;
  const known = formatters.get(key);
  if (known) return known;
  const created = new Intl.DateTimeFormat(LOCALES[language], {
    timeZone: TIME_ZONE,
    calendar: 'gregory',
    numberingSystem: 'latn',
    ...options,
  });
  formatters.set(key, created);
  return created;
}

/** "9:00 AM" / "9:00 ص" */
export function formatRiyadhTime(value: string | number, language: Language): string {
  return formatterFor(language, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: uses12Hours(language),
  }).format(new Date(value));
}

/** "Sunday, October 25" / "الأحد، 25 أكتوبر" */
export function formatRiyadhDay(value: string | number, language: Language): string {
  return formatterFor(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(value),
  );
}

/** "2026-10-25": the Saudi calendar day, so a late slot never lands under the wrong day. */
export function riyadhDayKey(value: string | number): string {
  const parts = formatterFor('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
