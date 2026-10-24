import { useId, type ReactNode } from 'react';
import styles from './Section.module.css';

type SectionProps = {
  title: string;
  children: ReactNode;
};

/** A titled block of a detail page. The title is the section's accessible name. */
export function Section({ title, children }: SectionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={styles.section}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  );
}
