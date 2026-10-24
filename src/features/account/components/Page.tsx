import type { ReactNode } from 'react';
import styles from './Page.module.css';

/** The vertical rhythm shared by every account screen. */
export function Page({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
