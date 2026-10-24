import { useId, type ComponentProps } from 'react';
import { cx } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import styles from './TextAreaField.module.css';

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string;
  hint?: string;
  error?: string | undefined;
  id?: string;
};

/** The multi-line sibling of the shared TextField, until the design system has one. */
export function TextAreaField({ label, hint, error, id, className, ...rest }: TextAreaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <textarea
        {...rest}
        id={fieldId}
        rows={3}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <p id={errorId} className={styles.error} aria-live="polite">
        {error && (
          <>
            <Icon name="alert-circle" size={18} />
            <span>{error}</span>
          </>
        )}
      </p>
    </div>
  );
}
