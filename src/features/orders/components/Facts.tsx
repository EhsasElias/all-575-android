import type { ReactNode } from 'react';
import { cx } from '@/shared/lib';
import styles from './Facts.module.css';

export function Facts({ children }: { children: ReactNode }) {
  return <dl className={styles.facts}>{children}</dl>;
}

type FactProps = {
  label: string;
  children: ReactNode;
  /** Makes the value stand out, e.g. a total. */
  strong?: boolean;
};

/** One label and its value, side by side while they fit and stacked when they do not. */
export function Fact({ label, children, strong = false }: FactProps) {
  return (
    <div className={styles.fact}>
      <dt className={styles.label}>{label}</dt>
      <dd className={cx(styles.value, strong && styles.strong)}>{children}</dd>
    </div>
  );
}
