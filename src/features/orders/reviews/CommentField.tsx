import { useId, type ComponentProps } from 'react';
import styles from './CommentField.module.css';

type CommentFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string;
  hint: string;
};

/** A labelled multi-line field. The shared TextField is single-line only. */
export function CommentField({ label, hint, ...rest }: CommentFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea {...rest} id={id} rows={3} className={styles.input} aria-describedby={hintId} />
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
    </div>
  );
}
