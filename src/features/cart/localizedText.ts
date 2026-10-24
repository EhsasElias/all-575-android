import type { Language } from '@/shared/i18n';
import type { LocalizedText } from './cartTypes';

/** How the API sends an optional name: either language can be missing, and the whole name can be null. */
type ApiName = { ar: string | null; en: string | null } | null;

/** The API's name as a complete bilingual text, or null when there is no name at all. */
export function fromApiName(name: ApiName): LocalizedText | null {
  if (name === null) return null;
  const ar = name.ar ?? name.en ?? '';
  const en = name.en ?? name.ar ?? '';
  return ar === '' && en === '' ? null : { ar, en };
}

/** The text in the customer's language, falling back to the other language if one side is empty. */
export function pickText(text: LocalizedText, language: Language): string {
  const preferred = text[language];
  if (preferred.trim() !== '') return preferred;
  return language === 'ar' ? text.en : text.ar;
}
