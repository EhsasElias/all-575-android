import { useId, type ComponentProps } from 'react';
import { cx } from '@/shared/lib';
import { Icon } from '../Icon/Icon';
import styles from './TextField.module.css';

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  id?: string | undefined;
};

export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
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
