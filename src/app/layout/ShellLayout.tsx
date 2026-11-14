import { Outlet, useLocation } from 'react-router';
import { useState } from 'react';
import { AccountSidebar } from './AccountSidebar';
import { routePaths } from '@/shared/lib';
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
  const { pathname } = useLocation();
  const accountRoute = status === 'signed-in' && (pathname === routePaths.account || pathname.startsWith('/account/') || pathname === routePaths.orders || pathname.startsWith('/orders/'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const wideAdmin = accountRoute;

  return (
    <div className={styles.shell}>
      <TestBuildBanner />
      <TopBar />
      {accountRoute ? (
        <div className={styles.accountShell}>
          <button type="button" className={styles.sidebarToggle} aria-expanded={sidebarOpen}
            aria-controls="account-navigation" onClick={() => setSidebarOpen(open => !open)}>
            {sidebarOpen ? '✕' : '☰'} {sidebarOpen ? 'Close account menu' : 'Account menu'}
          </button>
          <div id="account-navigation" className={sidebarOpen ? styles.sidebarArea + ' ' + styles.sidebarOpen : styles.sidebarArea}>
            <AccountSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main + ' ' + styles.mainWide + ' ' + styles.accountMain}>
            <Outlet />
          </main>
        </div>
      ) : (
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className={wideAdmin ? styles.main + ' ' + styles.mainWide : styles.main}>
          <Outlet />
        </main>
      )}
      <BottomNav badges={{ cart: cartCount }} guest={status === 'guest'} />
      <GuestCartMerger />
    </div>
  );
}
