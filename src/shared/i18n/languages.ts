export const LANGUAGES = ['ar', 'en', 'fr'] as const;

export type Language = (typeof LANGUAGES)[number];
export type Direction = 'rtl' | 'ltr';

export const DEFAULT_LANGUAGE: Language = 'ar';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export function getDirection(language: Language): Direction {
  return language === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Where to look for a text that the server sends in Arabic and English only: the chosen language first, then
 * English, then Arabic. French has no server text yet, so it reads English until the server has French.
 */
export function textLanguages(language: Language): readonly Language[] {
  if (language === 'ar') return ['ar', 'en'];
  if (language === 'en') return ['en', 'ar'];
  return [language, 'en', 'ar'];
}

type InitialLanguageInput = {
  stored: string | null;
  deviceLanguage: string | undefined;
};

/** A saved choice wins, then the device language if we support it, then Arabic. */
export function resolveInitialLanguage({ stored, deviceLanguage }: InitialLanguageInput): Language {
  if (isLanguage(stored)) return stored;
  const deviceBase = deviceLanguage?.toLowerCase().split('-')[0];
  return isLanguage(deviceBase) ? deviceBase : DEFAULT_LANGUAGE;
}
