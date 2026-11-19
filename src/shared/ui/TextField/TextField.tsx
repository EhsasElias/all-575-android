import { useId, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/shared/lib';
import { Icon } from '../Icon/Icon';
import styles from './TextField.module.css';

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  id?: string | undefined;
  showPasswordToggle?: boolean | undefined;
};

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  showPasswordToggle = false,
  type,
  ...rest
}: TextFieldProps) {
  const { i18n } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasToggle = showPasswordToggle && type === 'password';
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const revealLabel = language === 'ar' ? 'إظهار كلمة المرور' : 'Show password';
  const concealLabel = language === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password';

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={hasToggle ? styles.inputWithToggle : styles.inputContainer}>
        <input
          {...rest}
          type={hasToggle && passwordVisible ? 'text' : type}
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {hasToggle && (
          <button
            type="button"
            className={styles.visibilityButton}
            aria-label={passwordVisible ? concealLabel : revealLabel}
            aria-pressed={passwordVisible}
            title={passwordVisible ? concealLabel : revealLabel}
            onClick={() => {
              setPasswordVisible((previous) => !previous);
            }}
          >
            <Icon name={passwordVisible ? 'eye-off' : 'eye'} size={22} />
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {/* Always rendered so assistive technology notices when the message appears. */}
      <p id={errorId} className={styles.error} aria-live="polite">
        {error && (
          <>
            <Icon name="alert-circle" size={20} />
            <span>{error}</span>
          </>
        )}
      </p>
    </div>
  );
}
