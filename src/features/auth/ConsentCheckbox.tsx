import { useId, type ReactNode, type Ref } from 'react';
import { Icon } from '@/shared/ui';
import styles from './ConsentCheckbox.module.css';

type ConsentCheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  /** The sentence the customer agrees to; it may contain a link to the full text. */
  children: ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
  ref?: Ref<HTMLInputElement>;
};

/** A real checkbox in a roomy, tappable row, with its hint and error text tied to it for screen readers. */
export function ConsentCheckbox({
  checked,
  disabled = false,
  onChange,
  children,
  hint,
  error,
  ref,
}: ConsentCheckboxProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={styles.item}>
      <label className={styles.row} data-disabled={disabled || undefined}>
        <input
          ref={ref}
          type="checkbox"
          className={styles.box}
          checked={checked}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
        />
        <span className={styles.text}>{children}</span>
      </label>
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
