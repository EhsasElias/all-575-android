import { textLanguages, type Language } from '@/shared/i18n';
import type { LocalizedName } from './quote';

/** The name in the customer's language, falling back to the next language that has one rather than showing nothing. */
export function pickName(name: LocalizedName, language: Language): string {
  const names: Readonly<Partial<Record<Language, string | null>>> = name;
  for (const candidate of textLanguages(language)) {
    const value = names[candidate];
    if (value !== undefined && value !== null) return value;
  }
  return '';
}
