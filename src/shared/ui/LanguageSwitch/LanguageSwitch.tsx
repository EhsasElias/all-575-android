import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '@/shared/i18n';
import { cx } from '@/shared/lib';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './LanguageSwitch.module.css';

// The order on screen is fixed, whatever the language: EN, FR, then AR on the right.
const DISPLAY_ORDER: readonly Language[] = ['en', 'fr', 'ar'];

type LanguageSwitchProps = {
  value: Language;
  onChange: (language: Language) => void;
  className?: string | undefined;
};

/** EN | FR | AR as a native radio group, so arrow keys and screen readers work without extra code. */
export function LanguageSwitch({ value, onChange, className }: LanguageSwitchProps) {
  const { t } = useTranslation();
  const groupName = useId();

  return (
    <fieldset dir="ltr" className={cx(styles.group, className)}>
      <legend className={styles.legend}>{t('language.label')}</legend>
      {DISPLAY_ORDER.map((language) => (
        <label key={language} className={styles.option}>
          <input
            type="radio"
            name={groupName}
            value={language}
            checked={value === language}
            className={styles.input}
            onChange={() => {
              onChange(language);
            }}
          />
          <span className={styles.pill}>
            {language.toUpperCase()}{' '}
            <VisuallyHidden lang={language}>{t(`language.${language}`)}</VisuallyHidden>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
