import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

type PageHeaderProps = {
  title: string;
  lead?: string;
  /** A back link, shown above the title. */
  back?: ReactNode;
};

/** The one `h1` of a screen, with an optional way back and a short explanation. */
export function PageHeader({ title, lead, back }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {back}
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
    </header>
  );
}
