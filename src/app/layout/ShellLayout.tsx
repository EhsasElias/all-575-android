import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { MAIN_CONTENT_ID } from './SkipLink';
import { TopBar } from './TopBar';
import styles from './ShellLayout.module.css';

export function ShellLayout() {
  return (
    <div className={styles.shell}>
      <TopBar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
