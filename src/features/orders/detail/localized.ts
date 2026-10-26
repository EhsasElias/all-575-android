import { textLanguages, type Language } from '@/shared/i18n';

type Pair<T> = Readonly<Partial<Record<Language, T>>>;

/** A bilingual value in the language on screen, falling back to the next language that has it. */
export function localized(pair: Pair<string | null> | null, language: Language): string | null {
  if (pair === null) return null;
  for (const candidate of textLanguages(language)) {
    const value = pair[candidate];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}
