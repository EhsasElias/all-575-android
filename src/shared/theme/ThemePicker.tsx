import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, type ThemeChoice } from './useTheme';
import styles from './ThemePicker.module.css';

const CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system'];

export function ThemePicker() {
  const { t } = useTranslation('appearance');
  const { choice, setTheme } = useTheme();
  const name = useId();

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{t('label')}</legend>
      <div className={styles.options}>
        {CHOICES.map((value) => (
          <label key={value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={value}
              checked={choice === value}
              onChange={() => {
                setTheme(value);
              }}
            />
            <span>{t(value)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
