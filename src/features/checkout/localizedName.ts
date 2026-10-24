import type { Language } from '@/shared/i18n';
import type { LocalizedName } from './quote';

/** The name in the customer's language, falling back to the other one rather than showing nothing. */
export function pickName(name: LocalizedName, language: Language): string {
  const other: Language = language === 'ar' ? 'en' : 'ar';
  return name[language] ?? name[other] ?? '';
}
