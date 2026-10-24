import type { ComponentProps } from 'react';
import { cx } from '@/shared/lib';
import styles from './VisuallyHidden.module.css';

/** Text for screen readers only. Keep real labels visible wherever there is room. */
export function VisuallyHidden({ className, ...rest }: ComponentProps<'span'>) {
  return <span className={cx(styles.hidden, className)} {...rest} />;
}
