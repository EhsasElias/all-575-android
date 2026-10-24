import i18next, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { setPreference } from '@/shared/storage';
import { DEFAULT_LANGUAGE, getDirection, isLanguage, type Language } from './languages';

function applyDocumentLanguage(language: string): void {
  if (!isLanguage(language)) return;
  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
}

type InitI18nOptions = {
  resources: Resource;
  language: Language;
};

export async function initI18n({ resources, language }: InitI18nOptions): Promise<void> {
  i18next.off('languageChanged', applyDocumentLanguage);
  i18next.on('languageChanged', applyDocumentLanguage);
  await i18next.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    showSupportNotice: false,
  });
  applyDocumentLanguage(language);
}

export function getCurrentLanguage(): Language {
  return isLanguage(i18next.language) ? i18next.language : DEFAULT_LANGUAGE;
}

/** The user's explicit choice: applied now and remembered for the next launch. */
export async function changeLanguage(language: Language): Promise<void> {
  setPreference('language', language);
  await i18next.changeLanguage(language);
}
