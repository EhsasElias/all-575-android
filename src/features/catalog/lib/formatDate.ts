import type { Language } from '@/shared/i18n';

const RIYADH = 'Asia/Riyadh';

const formatters: Record<Language, Intl.DateTimeFormat> = {
  ar: createFormatter('ar-SA'),
  en: createFormatter('en-SA'),
  fr: createFormatter('fr-FR'),
};

// The Gregorian calendar and Latin digits, so a date reads the same as every other number in the app.
function createFormatter(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: RIYADH,
    calendar: 'gregory',
    numberingSystem: 'latn',
  });
}

/** A calendar date in Saudi time, or an empty string when the server sent none. */
export function formatDate(iso: string | null, language: Language): string {
  if (iso === null) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : formatters[language].format(date);
}
