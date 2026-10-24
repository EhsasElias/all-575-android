export const LANGUAGES = ['ar', 'en'] as const;

export type Language = (typeof LANGUAGES)[number];
export type Direction = 'rtl' | 'ltr';

export const DEFAULT_LANGUAGE: Language = 'ar';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export function getDirection(language: Language): Direction {
  return language === 'ar' ? 'rtl' : 'ltr';
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
