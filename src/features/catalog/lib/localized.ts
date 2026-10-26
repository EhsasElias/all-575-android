import { textLanguages, type Language } from '@/shared/i18n';

type Bilingual = Readonly<Partial<Record<Language, string | null>>>;

/** The text in the chosen language, or in the next one that has it (see `textLanguages`). */
export function pickText(value: Bilingual | null | undefined, language: Language): string {
  for (const candidate of textLanguages(language)) {
    const text = value?.[candidate]?.trim();
    if (text) return text;
  }
  return '';
}
