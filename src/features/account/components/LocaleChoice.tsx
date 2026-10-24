import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type Language } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import styles from './LocaleChoice.module.css';

type LocaleChoiceProps = {
  value: Language;
  error: string;
  onChange: (language: Language) => void;
};

/** Which language we write to the customer in. Each option is named in its own language. */
export function LocaleChoice({ value, error, onChange }: LocaleChoiceProps) {
  const { t } = useTranslation('account');
  const { t: tCommon } = useTranslation();
  const groupName = useId();
  const hintId = `${groupName}-hint`;
  const errorId = `${groupName}-error`;

  return (
    <fieldset className={styles.group} aria-describedby={error ? `${hintId} ${errorId}` : hintId}>
      <legend className={styles.legend}>{t('profile.localeLegend')}</legend>
      <p id={hintId} className={styles.hint}>
        {t('profile.localeHint')}
      </p>
      <div className={styles.options}>
        {LANGUAGES.map((language) => (
          <label key={language} className={styles.option}>
            <input
              type="radio"
              name={groupName}
              value={language}
              checked={value === language}
              className={styles.radio}
              onChange={() => {
                onChange(language);
              }}
            />
            <span lang={language}>{tCommon(`language.${language}`)}</span>
          </label>
        ))}
      </div>
      <p id={errorId} className={styles.error} aria-live="polite">
        {error && (
          <>
            <Icon name="alert-circle" size={18} />
            <span>{error}</span>
          </>
        )}
      </p>
    </fieldset>
  );
}
