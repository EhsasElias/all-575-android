import type { Language } from '@/shared/i18n';

type Bilingual = { readonly ar?: string | null; readonly en?: string | null };

/** The text in the chosen language, or in the other one only when the chosen one is empty. */
export function pickText(value: Bilingual | null | undefined, language: Language): string {
  const other = language === 'ar' ? 'en' : 'ar';
  const preferred = value?.[language]?.trim();
  if (preferred) return preferred;
  return value?.[other]?.trim() ?? '';
}
