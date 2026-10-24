import { useTranslation } from 'react-i18next';
import { changeLanguage } from './i18n';
import {
  DEFAULT_LANGUAGE,
  getDirection,
  isLanguage,
  type Direction,
  type Language,
} from './languages';

type UseLanguageResult = {
  language: Language;
  direction: Direction;
  setLanguage: (language: Language) => void;
};

export function useLanguage(): UseLanguageResult {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  return {
    language,
    direction: getDirection(language),
    setLanguage: (next) => {
      void changeLanguage(next);
    },
  };
}
