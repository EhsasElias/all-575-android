import type { Language } from '@/shared/i18n';

// Gregorian calendar and Latin digits in both languages, in the Saudi display time zone.
const LOCALES: Record<Language, string> = {
  ar: 'ar-SA-u-ca-gregory-nu-latn',
  en: 'en-SA-u-ca-gregory-nu-latn',
};

const formatters: Record<Language, Intl.DateTimeFormat> = {
  ar: createFormatter('ar'),
  en: createFormatter('en'),
};

function createFormatter(language: Language): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALES[language], {
    timeZone: 'Asia/Riyadh',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** An ISO date from the API (UTC) as a date and time in Riyadh. */
export function formatDateTime(iso: string, language: Language): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : formatters[language].format(date);
}
