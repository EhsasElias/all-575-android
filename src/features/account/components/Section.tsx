import { useId, type ReactNode } from 'react';
import styles from './Section.module.css';

type SectionProps = {
  title: string;
  children: ReactNode;
};

/** A titled group on an account screen: an `h2` and the card of controls under it. */
export function Section({ title, children }: SectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <h2 id={headingId} className={styles.title}>
        {title}
      </h2>
      <div className={styles.card}>{children}</div>
    </section>
  );
}
