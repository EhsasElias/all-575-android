import type { AriaRole, ReactNode } from 'react';
import { cx } from '@/shared/lib';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './EmptyState.module.css';

const HEADINGS = { 1: 'h1', 2: 'h2', 3: 'h3' } as const;

export type HeadingLevel = keyof typeof HEADINGS;

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  /** The next step: usually a Button or ButtonLink. */
  action?: ReactNode;
  tone?: 'neutral' | 'error';
  /** The heading level that fits where this appears on the page. */
  headingLevel?: HeadingLevel | undefined;
  role?: AriaRole | undefined;
  className?: string | undefined;
};

export function EmptyState({
  icon,
  title,
  message,
  action,
  tone = 'neutral',
  headingLevel = 2,
  role,
  className,
}: EmptyStateProps) {
  const Heading = HEADINGS[headingLevel];

  return (
    <section className={cx(styles.root, className)} role={role}>
      <span className={cx(styles.icon, tone === 'error' && styles.error)}>
        <Icon name={icon} size={36} />
      </span>
      <Heading className={styles.title}>{title}</Heading>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
