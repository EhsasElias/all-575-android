import type { Language } from '@/shared/i18n';

type Pair<T> = { ar: T; en: T };

/** A bilingual value in the language on screen, falling back to the other one if it is empty. */
export function localized(pair: Pair<string | null> | null, language: Language): string | null {
  if (pair === null) return null;
  const other = language === 'ar' ? 'en' : 'ar';
  return pair[language] ?? pair[other];
}
