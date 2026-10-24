import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { LanguageSwitch } from '@/shared/ui';
import styles from './Preferences.module.css';

/** The app language: it changes the whole screen at once and is remembered on this device. */
export function LanguagePreference() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.row}>
      {/* The switch names itself "Language" for assistive technology; this is the same word, for the eyes. */}
      <span aria-hidden="true" className={styles.label}>
        {t('language.label')}
      </span>
      <LanguageSwitch value={language} onChange={setLanguage} />
    </div>
  );
}
