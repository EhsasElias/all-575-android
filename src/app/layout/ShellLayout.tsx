import { Outlet } from 'react-router';
import { GuestCartMerger, useCartItemCount } from '@/features/cart';
import { TestBuildBanner } from '@/features/testserver';
import { useSession } from '@/shared/session';
import { BottomNav } from './BottomNav';
import { MAIN_CONTENT_ID } from './SkipLink';
import { TopBar } from './TopBar';
import styles from './ShellLayout.module.css';

export function ShellLayout() {
  const cartCount = useCartItemCount();
  const { status } = useSession();

  return (
    <div className={styles.shell}>
      <TestBuildBanner />
      <TopBar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <BottomNav badges={{ cart: cartCount }} guest={status === 'guest'} />
      <GuestCartMerger />
    </div>
  );
}
